# unitree-mcp Tool Reference

14 tools: 9 simulation lifecycle + 5 AI workflow assistants.

**Supported robots:** go2, go2w, b2, b2w, h1, h1_2, g1, h2, a2, r1

---

## Sim Tools (1-9)

### sim_status

**Description:** Health check — verifies Unitree upstream repos are cloned, discovers available robot models, reports running jobs.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters |

**Output:**
```json
{
  "success": true,
  "ready": true,
  "repos": {"unitree_mujoco": true, "unitree_ros2": true, "go2_ros2_sdk": true},
  "models": ["go2", "h1", "g1", "b2"],
  "running_jobs": [{"job_id": "a1b2c3d4", "robot": "h1", "status": "running"}]
}
```

**Examples:**
```python
await sim_status()
```

**State machine effect:** None — read-only. Jobs use SimJob dataclass (running / exited).

---

### load_model

**Description:** Load and validate a Unitree MuJoCo model file without starting the sim. Returns model metadata — joint count, actuator count, body names.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| robot | str | No | Robot model name (default: "go2") |

**Output:**
```json
{
  "success": true,
  "message": "Model 'h1' loaded (19 joints, 14 actuators).",
  "data": {"robot": "h1", "nq": 19, "nv": 18, "nu": 14, "body_names": [...], "joint_names": [...], "actuator_names": [...]}
}
```

**Examples:**
```python
await load_model(robot="h1")
await load_model(robot="go2")
```

---

### start_sim

**Description:** Start a Unitree MuJoCo simulation as a managed background process. Opens a viewer window by default.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| robot | str | No | Robot model name (default: "go2") |
| headless | bool | No | Run without GUI viewer (default: False) |

**Output:**
```json
{"success": true, "message": "Simulation started (job a1b2c3d4, robot h1).", "job_id": "a1b2c3d4", "robot": "h1", "pid": 12345, "status": "running", "uptime_s": 2.1, "log_path": "..."}
```

**Examples:**
```python
await start_sim(robot="h1", headless=False)
await start_sim(robot="go2", headless=True)
```

---

### stop_sim

**Description:** Stop a running simulation job. Terminates with 5s graceful timeout, then kills.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Job ID from start_sim |

**Output:**
```json
{"success": true, "message": "Job a1b2c3d4 stopped.", "job_id": "a1b2c3d4", "robot": "h1", "pid": 12345, "status": "exited (0)", "uptime_s": 12.5, "log_tail": [...]}
```

**Examples:**
```python
await stop_sim(job_id="a1b2c3d4")
```

---

### get_state

**Description:** Get current simulation state — joint positions, velocities, actuator forces, body positions. Reads from shared memory state file if available, or returns the current model's initial state.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |

**Output:**
```json
{"success": true, "message": "State for job a1b2c3d4.", "robot": "h1", "state": {"nq": 19, "nv": 18, "nu": 14, "qpos": [0.0, ...], "qvel": [0.0, ...], "time": 1.234}}
```

**Examples:**
```python
await get_state(job_id="a1b2c3d4")
```

---

### apply_control

**Description:** Apply control values to a running simulation. Writes a float array matching the model's actuator count (nu) to the job's control file.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |
| ctrl | list[float] | Yes | Actuator control values (length must match model's nu) |

**Output:**
```json
{"success": true, "message": "Control written (14 actuator values).", "ctrl_values": [0.0, 0.5, ...]}
```

**Examples:**
```python
await apply_control(job_id="a1b2c3d4", ctrl=[0.0, 0.5, -0.3, 0.0, 0.2, 0.0, ...])
```

---

### list_models

**Description:** List all available Unitree robot models with metadata (model file path, size, asset count).

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| refresh | bool | No | Force re-scan of the unitree_robots directory (default: False) |

**Output:**
```json
{"success": true, "message": "10 model(s) available.", "models": [{"name": "h1", "model_file": "...", "size_bytes": 204800, "has_assets": true, "asset_count": 42}, ...]}
```

**Examples:**
```python
await list_models()
await list_models(refresh=True)
```

---

### list_jobs

**Description:** List all simulation jobs, or get detail for one job with its log tail.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | No | Optional: detail view for one job |
| log_tail_lines | int | No | Log lines to include in detail view (default: 25, max: 200) |

**Output:**
```json
{"success": true, "message": "3 job(s) this session.", "jobs": [{"job_id": "...", "robot": "h1", "status": "running", "uptime_s": 30.5}, ...]}
```

**Examples:**
```python
await list_jobs()
await list_jobs(job_id="a1b2c3d4", log_tail_lines=50)
```

---

### export_frame

**Description:** Export the current sim frame (joint positions, body transforms) for fleet consumption. Writes a JSON frame to the fleet exchange for godot-mcp / unity3d-mcp integration.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |
| format | str | No | Export format: "json" (default) or "urdf" |

**Output:**
```json
{"success": true, "message": "Frame exported.", "path": "D:/.../_exchange/models/unitree/h1_frame_a1b2.json", "format": "json", "robot": "h1"}
```

**Examples:**
```python
await export_frame(job_id="a1b2c3d4")
await export_frame(job_id="a1b2c3d4", format="json")
```

---

## AI Workflow Tools (10-14)

### agentic_sim_workflow

**Description:** Uses the host LLM to plan and execute a multi-step Unitree simulation workflow. Falls back to Ollama.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| goal | str | Yes | Natural language goal |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Workflow completed.", "plan_and_result": "...", "sampling_used": true}
```

**Examples:**
```python
await agentic_sim_workflow(goal="Start a Go2 sim and make it walk")
await agentic_sim_workflow(goal="Start an H1 sim, apply torques, check state")
```

---

### natural_language_control

**Description:** Convert a natural language command to actuator values for a running sim.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | str | Yes | Natural language command |
| job_id | str | Yes | Active sim job ID |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Generated 3 actuator commands.", "controls": {"hip_joint": 0.5}, "source": "sampling"}
```

**Examples:**
```python
await natural_language_control(prompt="bend the right knee 30 degrees", job_id="a1b2c3d4")
await natural_language_control(prompt="stand up straight", job_id="a1b2c3d4")
```

---

### analyze_sim_state

**Description:** Read the current sim state and produce a natural-language analysis of the robot's behaviour.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "State analyzed.", "analysis": "The H1 humanoid is standing upright...", "robot": "h1", "sampling_used": true}
```

**Examples:**
```python
await analyze_sim_state(job_id="a1b2c3d4")
```

---

### analyze_sim_logs

**Description:** Read the sim log file and ask the LLM for root-cause analysis.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | str | Yes | Sim job ID |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Logs analyzed.", "analysis": "...", "sampling_used": true}
```

**Examples:**
```python
await analyze_sim_logs(job_id="a1b2c3d4")
```

---

### discover_model

**Description:** Generate candidate GitHub raw URLs for MuJoCo MJCF/XML models, download and validate them.

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| description | str | Yes | Model description |
| ctx | Context | Yes | FastMCP context (injected automatically) |

**Output:**
```json
{"success": true, "message": "Loaded 1/3 models.", "models_loaded": [{"url": "...", "name": "h1", "path": "..."}], "urls_tried": [...]}
```

**Examples:**
```python
await discover_model(description="Unitree H1 humanoid MuJoCo model")
```
