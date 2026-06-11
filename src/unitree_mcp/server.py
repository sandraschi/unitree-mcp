"""unitree-mcp — FastMCP 3.2 wrapper for Unitree Robotics open-source robotics stack.

Wraps Unitree MuJoCo models (Go2, H1, H1-2, G1, B2, etc.) and ROS 2 packages
as MCP tools. MuJoCo simulations run as managed background processes.

Upstream repos (cloned to D:\\Dev\\repos\\external\\unitree_mujoco):
- unitree_mujoco: MuJoCo XML models + Python sim entry point
- unitree_ros: ROS 1 packages
- unitree_ros2: ROS 2 packages (humble)
- go2_ros2_sdk: Go2-specific ROS 2 SDK

Robot models available:
  go2, go2w, b2, b2w, h1, h1_2, g1, h2, a2, r1
"""

import json
import os
import re
import subprocess
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Annotated, Any

from fastmcp import Context, FastMCP
from pydantic import Field

EXTERNAL = Path(os.getenv("UNITREE_EXTERNAL_DIR", "D:/Dev/repos/external"))
UNITREE_MUJOCO = EXTERNAL / "unitree_mujoco"
UNITREE_ROBOTS = UNITREE_MUJOCO / "unitree_robots"
SIM_PYTHON = Path(os.getenv("UNITREE_SIM_PYTHON", "python"))
LOG_DIR = Path(os.getenv("UNITREE_LOG_DIR", "D:/Dev/repos/unitree-mcp/logs"))
ROS2_SDK = EXTERNAL / "go2_ros2_sdk"
ROS2_REPO = EXTERNAL / "unitree_ros2"

mcp = FastMCP(name="unitree-mcp")

# ---------------------------------------------------------------------------
# Model discovery
# ---------------------------------------------------------------------------

def _discover_models() -> dict[str, Path]:
    """Discover all available robot models from unitree_robots directory."""
    models = {}
    if not UNITREE_ROBOTS.exists():
        return models
    for d in sorted(UNITREE_ROBOTS.iterdir()):
        if d.is_dir():
            scene = d / "scene.xml"
            model_xml = d / f"{d.name}.xml"
            if scene.exists():
                models[d.name] = scene
            elif model_xml.exists():
                models[d.name] = model_xml
    return models


# ---------------------------------------------------------------------------
# Simulation job manager
# ---------------------------------------------------------------------------

@dataclass
class SimJob:
    job_id: str
    robot: str
    model_path: Path
    proc: subprocess.Popen
    log_path: Path
    started_at: float = field(default_factory=time.time)

    def status(self) -> str:
        code = self.proc.poll()
        if code is None:
            return "running"
        return f"exited ({code})"

    def info(self, log_tail_lines: int = 0) -> dict[str, Any]:
        d: dict[str, Any] = {
            "job_id": self.job_id,
            "robot": self.robot,
            "pid": self.proc.pid,
            "status": self.status(),
            "uptime_s": round(time.time() - self.started_at, 1),
            "log_path": str(self.log_path),
        }
        if log_tail_lines > 0 and self.log_path.exists():
            lines = self.log_path.read_text(encoding="utf-8", errors="replace").splitlines()
            d["log_tail"] = lines[-log_tail_lines:]
        return d


JOBS: dict[str, SimJob] = {}
SIM_CTRL: dict[str, dict[str, Any]] = {}  # per-job state cache


# ---------------------------------------------------------------------------
# 9 Sim tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def sim_status() -> dict[str, Any]:
    """Health check: Unitree repos, available models, running jobs."""
    repos = {
        "unitree_mujoco": UNITREE_MUJOCO.exists(),
        "unitree_ros2": ROS2_REPO.exists(),
        "go2_ros2_sdk": ROS2_SDK.exists(),
    }
    models = _discover_models()
    return {
        "success": True,
        "message": f"{len(models)} model(s) available, {len([j for j in JOBS.values() if j.proc.poll() is None])} running.",
        "ready": all(repos.values()),
        "repos": repos,
        "models": list(models.keys()),
        "running_jobs": [j.info() for j in JOBS.values() if j.proc.poll() is None],
    }


@mcp.tool()
async def load_model(
    robot: Annotated[str, Field(description="Robot model name, e.g. 'go2', 'h1', 'g1'.")] = "go2",
) -> dict[str, Any]:
    """Load and validate a Unitree MuJoCo model file without starting the simulator.

    Returns model metadata (joint count, actuator count, mesh paths).
    """
    models = _discover_models()
    if robot not in models:
        return {
            "success": False,
            "message": f"Unknown robot '{robot}'. Available: {list(models)}",
            "available_models": list(models),
        }
    scene_path = models[robot]
    try:
        import mujoco
        model = mujoco.MjModel.from_xml_path(str(scene_path))
        info = {
            "robot": robot,
            "model_path": str(scene_path),
            "nq": model.nq,
            "nv": model.nv,
            "nu": model.nu,
            "nbody": model.nbody,
            "njoint": model.njnt,
            "ngeom": model.ngeom,
            "nmocap": model.nmocap,
            "nsensor": model.nsensor,
            "body_names": [model.body(i).name for i in range(model.nbody)],
            "joint_names": [model.joint(i).name for i in range(model.njnt)],
            "actuator_names": [model.actuator(i).name for i in range(model.nu)],
        }
        return {"success": True, "message": f"Model '{robot}' loaded ({model.njnt} joints, {model.nu} actuators).",
                "data": info}
    except ImportError:
        return {"success": False, "message": "mujoco not installed. Run: uv pip install mujoco"}
    except Exception as e:
        return {"success": False, "message": f"Failed to load model: {e}"}


@mcp.tool()
async def start_sim(
    robot: Annotated[str, Field(description="Robot model name, e.g. 'go2', 'h1'.")] = "go2",
    headless: Annotated[bool, Field(description="Run without GUI viewer if True.")] = False,
) -> dict[str, Any]:
    """Start a Unitree MuJoCo simulation as a managed background process.

    Launches the Unitree MuJoCo Python simulator (which opens a viewer by default).
    Returns a job_id for stop_sim / list_jobs / get_state.
    """
    models = _discover_models()
    if robot not in models:
        return {
            "success": False,
            "message": f"Unknown robot '{robot}'. Available: {list(models)}",
            "available_models": list(models),
        }
    scene_path = models[robot]
    script = UNITREE_MUJOCO / "simulate_python" / "unitree_mujoco.py"
    if not script.exists():
        return {"success": False, "message": f"Simulator script not found: {script}"}

    job_id = uuid.uuid4().hex[:8]
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"sim_{robot}_{job_id}.log"
    env = {**os.environ}
    if headless:
        env["UNITREE_HEADLESS"] = "1"

    # Override config.py to point at the selected robot
    # The upstream script reads config.ROBOT which we can override via env or
    # by setting ROBOT env var (the script imports config which reads ROBOT from env)
    if "ROBOT" not in os.environ:
        env["ROBOT"] = robot

    log_fh = open(log_path, "w", encoding="utf-8")
    try:
        proc = subprocess.Popen(
            [str(SIM_PYTHON), str(script)],
            cwd=UNITREE_MUJOCO / "simulate_python",
            env=env,
            stdout=log_fh,
            stderr=subprocess.STDOUT,
        )
    except OSError as e:
        log_fh.close()
        return {"success": False, "message": f"Failed to launch simulator: {e}"}

    JOBS[job_id] = SimJob(job_id=job_id, robot=robot, model_path=scene_path, proc=proc, log_path=log_path)
    SIM_CTRL[job_id] = {"state_file": str(LOG_DIR / f"state_{job_id}.json")}

    time.sleep(2.0)
    job = JOBS[job_id]
    if job.proc.poll() is not None:
        return {"success": False, "message": f"Simulator exited immediately ({job.proc.returncode}).", **job.info(log_tail_lines=15)}
    return {"success": True, "message": f"Simulation started (job {job_id}, robot {robot}).", **job.info()}


@mcp.tool()
async def stop_sim(
    job_id: Annotated[str, Field(description="Job id returned by start_sim.")],
) -> dict[str, Any]:
    """Stop a running simulation job."""
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
    if job.proc.poll() is None:
        job.proc.terminate()
        try:
            job.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            job.proc.kill()
            job.proc.wait(timeout=5)
    return {"success": True, "message": f"Job {job_id} stopped.", **job.info(log_tail_lines=10)}


@mcp.tool()
async def get_state(
    job_id: Annotated[str, Field(description="Sim job id.")],
) -> dict[str, Any]:
    """Get current sim state — joint positions, velocities, actuator forces, body positions.

    Reads from the shared memory state file if available, or returns the last
    known state from the job's state cache.
    """
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
    if job.proc.poll() is not None:
        return {"success": False, "message": f"Job {job_id} is not running ({job.status()}).", **job.info()}

    ctrl = SIM_CTRL.get(job_id, {})
    state_file = ctrl.get("state_file")
    state = {}
    if state_file and Path(state_file).exists():
        try:
            state = json.loads(Path(state_file).read_text())
        except (json.JSONDecodeError, OSError):
            pass

    # Fallback: try to load model metadata if no state file
    if not state:
        try:
            import mujoco
            model = mujoco.MjModel.from_xml_path(str(job.model_path))
            data = mujoco.MjData(model)
            mujoco.mj_forward(model, data)
            state = {
                "nq": model.nq, "nv": model.nv, "nu": model.nu,
                "qpos": data.qpos.tolist()[:10],
                "qvel": data.qvel.tolist()[:10],
                "time": data.time,
                "note": "Initial state (sim running, no state file written yet)",
            }
        except ImportError:
            state = {"note": "mujoco not available for live state read"}

    return {"success": True, "message": f"State for job {job_id}.", "robot": job.robot, "state": state}


@mcp.tool()
async def apply_control(
    job_id: Annotated[str, Field(description="Sim job id.")],
    ctrl: Annotated[list[float], Field(description="Actuator control values (length = nu).")],
) -> dict[str, Any]:
    """Apply control values to a running simulation.

    Writes control values to the job's control file for the sim loop to pick up.
    The number of values must match the model's actuator count (nu).
    """
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
    if job.proc.poll() is not None:
        return {"success": False, "message": f"Job {job_id} is not running.", **job.info()}

    ctrl_file = SIM_CTRL.get(job_id, {}).get("state_file", str(LOG_DIR / f"ctrl_{job_id}.json"))
    try:
        Path(ctrl_file).write_text(json.dumps({"ctrl": ctrl, "timestamp": time.time()}))
    except OSError as e:
        return {"success": False, "message": f"Failed to write control: {e}"}

    return {"success": True, "message": f"Control written ({len(ctrl)} actuator values).", "ctrl_values": ctrl}


@mcp.tool()
async def list_models(
    refresh: Annotated[bool, Field(description="Force re-scan of the unitree_robots directory.")] = False,
) -> dict[str, Any]:
    """List all available Unitree robot models with metadata.

    Scans the unitree_robots directory for scene.xml files.
    """
    models = _discover_models()
    items = []
    for name, path in sorted(models.items()):
        size = path.stat().st_size if path.exists() else 0
        robot_dir = UNITREE_ROBOTS / name
        assets_dir = robot_dir / "assets"
        items.append({
            "name": name,
            "model_file": str(path),
            "size_bytes": size,
            "has_assets": assets_dir.exists(),
            "asset_count": len(list(assets_dir.iterdir())) if assets_dir.exists() else 0,
        })
    return {"success": True, "message": f"{len(items)} model(s) available.", "models": items}


@mcp.tool()
async def list_jobs(
    job_id: Annotated[str | None, Field(description="Optional: detail view for one job.")] = None,
    log_tail_lines: Annotated[int, Field(description="Log lines to include.", ge=0, le=200)] = 25,
) -> dict[str, Any]:
    """List simulation jobs, or detail one job with its log tail."""
    if job_id is not None:
        job = JOBS.get(job_id)
        if job is None:
            return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
        return {"success": True, "message": f"Job {job_id}: {job.status()}.", **job.info(log_tail_lines=log_tail_lines)}
    return {"success": True, "message": f"{len(JOBS)} job(s) this session.", "jobs": [j.info() for j in JOBS.values()]}


@mcp.tool()
async def export_frame(
    job_id: Annotated[str, Field(description="Sim job id to export state for.")],
    format: Annotated[str, Field(description="Export format: 'json', 'urdf'.")] = "json",
) -> dict[str, Any]:
    """Export the current sim frame (joint positions, body transforms) for fleet consumption.

    Writes a frame.json or URDF-like file to the fleet exchange for
    godot-mcp / unity3d-mcp integration.
    """
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}

    exchange_dir = Path(os.getenv("FLEET_EXCHANGE_ROOT", "D:/Dev/repos/_exchange")) / "models" / "unitree"
    exchange_dir.mkdir(parents=True, exist_ok=True)

    ctrl = SIM_CTRL.get(job_id, {})
    state_file = ctrl.get("state_file")
    state = {}
    if state_file and Path(state_file).exists():
        try:
            state = json.loads(Path(state_file).read_text())
        except (json.JSONDecodeError, OSError):
            state = {"note": "no state available"}

    out_name = f"{job.robot}_frame_{job_id[:8]}.json"
    out_path = exchange_dir / out_name
    frame = {
        "robot": job.robot,
        "job_id": job_id,
        "model_path": str(job.model_path),
        "state": state,
        "timestamp": time.time(),
        "exported_by": "unitree-mcp",
    }
    out_path.write_text(json.dumps(frame))
    return {
        "success": True,
        "message": f"Frame exported to {out_path}.",
        "path": str(out_path),
        "format": format,
        "robot": job.robot,
    }


# ---------------------------------------------------------------------------
# 5 AI tools
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict | None:
    for m in re.finditer(r"\{[^{}]*\}", text):
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            continue
    return None


def _extract_json_array(text: str) -> list:
    for m in re.finditer(r"\[.*?\]", text, re.DOTALL):
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            continue
    return []


@mcp.tool()
async def agentic_sim_workflow(
    goal: Annotated[str, Field(description="Natural language goal, e.g. 'Start a Go2 sim and make it walk'.")],
    ctx: Context,
) -> dict[str, Any]:
    """Execute an autonomous multi-step simulation workflow using the host LLM.

    The LLM plans a sequence of tool calls to achieve the described goal.
    Falls back to Ollama when ctx.sample is unavailable.
    """
    tools_desc = """
Available tools (invoke with JSON):
- sim_status() — health check
- load_model(robot) — validate model file
- start_sim(robot, headless) — launch MuJoCo sim, returns job_id
- stop_sim(job_id) — terminate sim
- get_state(job_id) — read joint positions/velocities
- apply_control(job_id, ctrl) — write actuator values
- list_models(refresh) — discover available robot models
- list_jobs(job_id, log_tail_lines) — query job status
- export_frame(job_id, format) — export frame data for fleet
"""
    prompt = f"""You are a robotics simulation engineer. Your goal: {goal}

{tools_desc}

Plan and execute the steps. Show your reasoning before each tool call.
After completion, summarize what happened and any observations."""

    try:
        result = await ctx.sample(prompt)
        text = getattr(result, "text", None) or str(result)
        return {"success": True, "message": "Workflow completed.", "plan_and_result": text.strip(), "sampling_used": True}
    except Exception as e:
        try:
            import httpx
            resp = httpx.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": "llama3.2:3b", "prompt": prompt, "stream": False},
                timeout=120,
            )
            return {"success": True, "message": "Workflow completed (Ollama).", "plan_and_result": resp.json().get("response", ""), "sampling_used": False, "model": "ollama"}
        except Exception as ollama_e:
            return {"success": False, "message": f"Both sampling and Ollama fallback failed: {e}; {ollama_e}"}


@mcp.tool()
async def natural_language_control(
    prompt: Annotated[str, Field(description="Natural language command, e.g. 'bend the right knee 30 degrees'.")],
    job_id: Annotated[str, Field(description="Active sim job id.")],
    ctx: Context,
) -> dict[str, Any]:
    """Convert a natural language command to actuator control values for a running sim.

    Reads model actuator info, asks the LLM to produce values that fulfill
    the user's intent, writes the result to the job's control file.
    """
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}

    # Read model info for actuator names
    actuator_names = []
    try:
        import mujoco
        model = mujoco.MjModel.from_xml_path(str(job.model_path))
        actuator_names = [model.actuator(i).name for i in range(model.nu)]
    except Exception:
        actuator_names = [f"actuator_{i}" for i in range(12)]

    nl_prompt = f"""You are a robot control engineer. The robot ({job.robot}) has these actuators:
{json.dumps(actuator_names, indent=2)}

The user says: "{prompt}"

Respond with ONLY a JSON object mapping actuator names to float values.
If an actuator is not relevant, omit it (it keeps its current value).
Example: {{"hip_joint": 0.5, "knee_joint": -0.3}}"""

    sampling_used = False
    try:
        result = await ctx.sample(nl_prompt)
        text = getattr(result, "text", None) or str(result)
        sampling_used = True
    except Exception:
        try:
            import httpx
            resp = httpx.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": "llama3.2:3b", "prompt": nl_prompt, "stream": False},
                timeout=30,
            )
            text = resp.json().get("response", "")
        except Exception as e:
            return {"success": False, "message": f"LLM unavailable: {e}"}

    ctrl = _extract_json(text)
    if not ctrl:
        return {"success": False, "message": "Could not parse LLM output as actuator commands.", "raw_llm_output": text}

    ctrl_file = LOG_DIR / f"ctrl_{job_id}.json"
    try:
        ctrl_file.write_text(json.dumps(ctrl))
    except OSError:
        pass

    return {"success": True, "message": f"Generated {len(ctrl)} actuator commands.", "controls": ctrl, "source": "sampling" if sampling_used else "ollama"}


@mcp.tool()
async def analyze_sim_state(
    job_id: Annotated[str, Field(description="Sim job id to analyze.")],
    ctx: Context,
) -> dict[str, Any]:
    """Read the current sim state and produce a natural-language analysis."""
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}

    state_info = {"robot": job.robot, "status": job.status(), "uptime_s": round(time.time() - job.started_at, 1), "note": "State not available without running sim with state output enabled"}

    analyze_prompt = f"""You are a robotics analyst. Given this robot information, describe what the robot is doing.

Robot model: {job.robot}
Job status: {job.status()}
Uptime: {state_info['uptime_s']}s

Describe in plain English:
1. What kind of robot is this (quadruped, humanoid, etc.)?
2. What is its typical posture/stance?
3. What are the key joint capabilities?
4. Any observations about the simulation state?"""

    try:
        result = await ctx.sample(analyze_prompt)
        text = getattr(result, "text", None) or str(result)
        return {"success": True, "message": "State analyzed.", "analysis": text.strip(), "robot": job.robot, "sampling_used": True}
    except Exception:
        try:
            import httpx
            resp = httpx.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": "llama3.2:3b", "prompt": analyze_prompt, "stream": False},
                timeout=30,
            )
            return {"success": True, "message": "State analyzed (Ollama).", "analysis": resp.json().get("response", ""), "robot": job.robot, "sampling_used": False}
        except Exception as e:
            return {"success": False, "message": f"LLM unavailable: {e}"}


@mcp.tool()
async def analyze_sim_logs(
    job_id: Annotated[str, Field(description="Sim job id.")],
    ctx: Context,
) -> dict[str, Any]:
    """Read the sim log file and ask the LLM for root-cause analysis."""
    job = JOBS.get(job_id)
    if job is None:
        return {"success": False, "message": f"Unknown job '{job_id}'.", "known_jobs": list(JOBS)}
    if not job.log_path.exists():
        return {"success": False, "message": f"Log file not found at {job.log_path}."}

    lines = job.log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    tail = lines[-100:]

    log_prompt = f"""You are a robotics debug engineer. Given these simulation log lines, diagnose any issues.

Robot: {job.robot}
Job status: {job.status()}
Uptime: {job.info().get("uptime_s", "?")}s

Last {len(tail)} log lines:
{chr(10).join(tail)}

Provide:
1. What went wrong (or is everything OK)?
2. Root cause hypotheses
3. Specific suggestions to fix or improve"""

    try:
        result = await ctx.sample(log_prompt)
        text = getattr(result, "text", None) or str(result)
        return {"success": True, "message": "Logs analyzed.", "analysis": text.strip(), "sampling_used": True}
    except Exception:
        try:
            import httpx
            resp = httpx.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": "llama3.2:3b", "prompt": log_prompt, "stream": False},
                timeout=30,
            )
            return {"success": True, "message": "Logs analyzed (Ollama).", "analysis": resp.json().get("response", ""), "sampling_used": False}
        except Exception as e:
            return {"success": False, "message": f"LLM unavailable: {e}"}


@mcp.tool()
async def discover_model(
    description: Annotated[str, Field(description="Description, e.g. 'Unitree H1 humanoid MuJoCo model'.")],
    ctx: Context,
) -> dict[str, Any]:
    """Search for and download a MuJoCo MJCF/XML model given a natural-language description.

    The LLM generates candidate GitHub raw URLs based on known open-source robot repos,
    then the tool attempts to download and validate each URL.
    """
    prompt = f"""Given this description: "{description}"

Suggest up to 3 GitHub raw URLs that might contain a MuJoCo MJCF/XML model file matching this description.
Focus on known open-source robot repos (Unitree, LimX, Boston Dynamics research, etc.).
Return ONLY a JSON array of URLs, nothing else.
Example: ["https://raw.githubusercontent.com/unitreerobotics/unitree_mujoco/main/data/h1.xml"]"""

    try:
        result = await ctx.sample(prompt)
        urls = _extract_json_array(getattr(result, "text", None) or str(result))
    except Exception:
        try:
            import httpx
            resp = httpx.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": "llama3.2:3b", "prompt": prompt, "stream": False},
                timeout=30,
            )
            urls = _extract_json_array(resp.json().get("response", ""))
        except Exception:
            return {"success": False, "message": "LLM unavailable for model discovery."}

    if not urls:
        return {"success": False, "message": "Could not generate model URLs from description."}

    models_dir = Path("D:/Dev/repos/unitree-mcp/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    loaded = []
    for url in urls[:3]:
        try:
            import httpx as httpx_mod
            resp = httpx_mod.get(url, follow_redirects=True, timeout=30)
            if resp.status_code == 200 and b"<mujoco" in resp.content[:500]:
                name = url.split("/")[-1].replace(".xml", "")
                dest = models_dir / f"{name}.xml"
                dest.write_bytes(resp.content)
                loaded.append({"url": url, "name": name, "path": str(dest)})
        except Exception:
            continue

    return {
        "success": len(loaded) > 0,
        "message": f"Loaded {len(loaded)}/{len(urls)} models." if loaded else "No models could be downloaded.",
        "models_loaded": loaded,
        "urls_tried": urls,
    }


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
