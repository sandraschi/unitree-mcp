import { useState } from "react";

const TABS = ["Overview", "Tools", "Setup", "Troubleshooting"];

const TOOLS = [
  { name: "sim_status", desc: "Health check: MuJoCo, model dirs, active jobs", group: "Core Sim" },
  { name: "load_model", desc: "Download/load a MuJoCo model into the depot", group: "Core Sim" },
  { name: "start_sim", desc: "Launch a MuJoCo simulation as an isolated subprocess", group: "Core Sim" },
  { name: "stop_sim", desc: "Stop a running simulation by job_id", group: "Core Sim" },
  { name: "get_state", desc: "Read joint positions, velocities, and sensor data", group: "Core Sim" },
  { name: "apply_control", desc: "Apply control signals (position, velocity, torque)", group: "Core Sim" },
  { name: "list_models", desc: "List all models in the depot with metadata", group: "Core Sim" },
  { name: "list_jobs", desc: "List active and completed simulation jobs", group: "Core Sim" },
  { name: "export_frame", desc: "Export the latest offscreen render frame as base64 PNG", group: "Core Sim" },
  { name: "agentic_sim_workflow", desc: "Multi-step sim orchestration via host LLM", group: "AI Workflow" },
  { name: "natural_language_control", desc: "NL to actuator control values", group: "AI Workflow" },
  { name: "analyze_sim_state", desc: "Describe robot posture/behaviour from state data", group: "AI Workflow" },
  { name: "analyze_sim_logs", desc: "Root-cause diagnosis from sim stderr", group: "AI Workflow" },
  { name: "discover_model", desc: "Find + download MJCF from GitHub by description", group: "AI Workflow" },
];

const TROUBLES = [
  { symptom: "MuJoCo not found / ImportError", cause: "mujoco package not installed", fix: "uv pip install mujoco (requires MuJoCo 3.2+)" },
  { symptom: "Robot model not found", cause: "UNITREE_EXTERNAL_DIR not set or unitree_mujoco not cloned", fix: "Set UNITREE_EXTERNAL_DIR to parent of unitree_mujoco. Default: D:/Dev/repos/external" },
  { symptom: "Simulation crashes on start", cause: "Invalid scene.xml or missing mesh files", fix: "Check jobs/<job_id>/runner.log. Verify scene.xml references valid meshes." },
  { symptom: "Unitree model list is empty", cause: "unitree_robots/ directory not found", fix: "Clone Unitree MuJoCo models: git clone https://github.com/unitreerobotics/unitree_mujoco to UNITREE_EXTERNAL_DIR" },
  { symptom: "ROS 2 tools fail", cause: "go2_ros2_sdk not cloned or ROS 2 not installed", fix: "Clone go2_ros2_sdk to UNITREE_EXTERNAL_DIR. Install ROS 2 Humble for full functionality." },
  { symptom: "Web dashboard not loading", cause: "Backend or Vite not running", fix: "Ensure backend (11052) and Vite (11053) are both running. Check browser console." },
  { symptom: "Port already in use", cause: "Previous instance still listening", fix: "Get-NetTCPConnection -LocalPort 11052,11053 | Stop-Process -Id {OwningProcess} -Force" },
  { symptom: "export_frame returns empty", cause: "No offscreen rendering support", fix: "Ensure EGL/OSMesa drivers are installed. On Windows this usually works with the standard MuJoCo build." },
  { symptom: "apply_control has no effect", cause: "Joint/actuator name mismatch", fix: "Use get_state() to list joint names first, then match control names exactly." },
];

export default function Help() {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Help</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === i ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <Overview />}
      {tab === 1 && <Tools />}
      {tab === 2 && <Setup />}
      {tab === 3 && <Troubleshooting />}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-4">
      <Card title="What It Is">
        <p className="text-sm text-slate-600 mb-2">
          <strong>unitree-mcp</strong> is a FastMCP 3.2 wrapper for the Unitree Robotics open-source stack.
          It wraps Unitree MuJoCo models (Go2, H1, G1, B2, etc.) and ROS 2 packages as MCP tools.
          MuJoCo simulations run as managed background processes.
        </p>
        <p className="text-sm text-slate-600">
          Upstream repos live at <code className="text-xs bg-slate-100 px-1 rounded">D:\Dev\repos\external\</code>: <strong>unitree_mujoco</strong> (MuJoCo models),
          <strong> unitree_ros2</strong> (ROS 2 Humble packages), and <strong>go2_ros2_sdk</strong> (Go2-specific SDK).
          10 robot models are supported out of the box.
        </p>
      </Card>

      <Card title="Architecture">
        <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto mb-3">
{`MCP Client (Claude Desktop, Cursor)
    │  stdio / HTTP
    ▼
FastMCP server (port 11052)
    │  subprocess (MuJoCo Python runner)
    ▼
Unitree MuJoCo simulation
    │  scene.xml loaded from unitree_robots/
    │  control loop at sim frequency
    │  state sync via JSON files
    │
    │  (optional) ROS 2 bridge via go2_ros2_sdk`}
        </pre>
        <p className="text-sm text-slate-600">All 10 robot models (go2, go2w, b2, b2w, h1, h1_2, g1, h2, a2, r1) are auto-discovered from <code className="text-xs bg-slate-100 px-1 rounded">unitree_robots/</code>.</p>
      </Card>

      <Card title="Ports">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Port</th>
              <th className="pb-2 font-medium">Service</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4 text-xs font-mono">11052</td>
              <td className="py-2 text-xs text-slate-600">FastAPI backend + MCP HTTP</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-xs font-mono">11053</td>
              <td className="py-2 text-xs text-slate-600">Vite React frontend (dev)</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card title="Supported Robots">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">Go2</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">Go2W</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">B2</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">B2W</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">H1</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">H1-2</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">G1</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">H2</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">A2</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">R1</span>
        </div>
      </Card>

      <Card title="Badges">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Python 3.11+</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">MuJoCo 3.2+</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">14 tools</span>
          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium">10 robot models</span>
        </div>
      </Card>
    </div>
  );
}

function Tools() {
  const sim = TOOLS.filter((t) => t.group === "Core Sim");
  const ai = TOOLS.filter((t) => t.group === "AI Workflow");
  return (
    <div className="space-y-4">
      <Card title="Core Simulation Tools (9)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Tool</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {sim.map((t) => (
                <tr key={t.name} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-xs font-mono text-blue-700 whitespace-nowrap">{t.name}</td>
                  <td className="py-2 text-xs text-slate-600">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="AI Workflow Tools (5)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Tool</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {ai.map((t) => (
                <tr key={t.name} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-xs font-mono text-blue-700 whitespace-nowrap">{t.name}</td>
                  <td className="py-2 text-xs text-slate-600">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">Full reference: <code className="text-xs bg-slate-100 px-1 rounded">docs/TOOLS.md</code> in the repo.</p>
      </Card>
    </div>
  );
}

function Setup() {
  return (
    <div className="space-y-4">
      <Card title="Prerequisites">
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          <li><strong>Python 3.11+</strong> — tested with 3.12, 3.13</li>
          <li><strong>MuJoCo</strong> — <code className="text-xs bg-slate-100 px-1 rounded">uv pip install mujoco</code></li>
          <li><strong>Git</strong> — for cloning the repo and upstream models</li>
          <li><strong>uv</strong> (recommended) — <code className="text-xs bg-slate-100 px-1 rounded">pip install uv</code></li>
          <li><strong>Node.js 20+</strong> — for the web dashboard</li>
          <li><strong>ROS 2 Humble</strong> (optional) — for ROS 2 bridge features</li>
        </ul>
      </Card>

      <Card title="Quick Install">
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
{`git clone https://github.com/sandraschi/unitree-mcp
cd unitree-mcp
uv sync

# Clone upstream Unitree MuJoCo models
git clone https://github.com/unitreerobotics/unitree_mujoco D:/Dev/repos/external/unitree_mujoco

uv run python -m unitree_mcp

# Start web dashboard
.\web_sota\start.ps1`}
        </pre>
      </Card>

      <Card title="Configuration">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Variable</th>
                <th className="pb-2 pr-4 font-medium">Default</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs font-mono">UNITREE_EXTERNAL_DIR</td>
                <td className="py-2 pr-4 text-xs text-slate-500">D:/Dev/repos/external</td>
                <td className="py-2 text-xs text-slate-600">Directory with unitree_mujoco and ROS 2 SDK repos</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs font-mono">UNITREE_SIM_PYTHON</td>
                <td className="py-2 pr-4 text-xs text-slate-500">python</td>
                <td className="py-2 text-xs text-slate-600">Python interpreter for MuJoCo sim processes</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs font-mono">UNITREE_LOG_DIR</td>
                <td className="py-2 pr-4 text-xs text-slate-500">./logs/</td>
                <td className="py-2 text-xs text-slate-600">Simulation log output directory</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs font-mono">OLLAMA_URL</td>
                <td className="py-2 pr-4 text-xs text-slate-500">http://localhost:11434</td>
                <td className="py-2 text-xs text-slate-600">Ollama for AI tool fallback</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Development Commands">
        <pre className="bg-slate-900 text-green-300 text-xs p-3 rounded font-mono whitespace-pre-wrap">
{`uv run pytest tests/ -q          # unit tests
just lint                       # ruff check`}
        </pre>
      </Card>
    </div>
  );
}

function Troubleshooting() {
  return (
    <Card title="Common Issues">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Symptom</th>
              <th className="pb-2 pr-4 font-medium">Cause</th>
              <th className="pb-2 font-medium">Fix</th>
            </tr>
          </thead>
          <tbody>
            {TROUBLES.map((t, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-xs text-red-700 font-medium align-top">{t.symptom}</td>
                <td className="py-2 pr-4 text-xs text-slate-600 align-top">{t.cause}</td>
                <td className="py-2 text-xs text-slate-800 font-mono align-top whitespace-pre-wrap">{t.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-600">
        <p className="mb-1"><strong>Log files:</strong> <code className="text-xs bg-slate-100 px-1 rounded">logs/&lt;job_id&gt;.log</code> — per-simulation subprocess output</p>
        <p className="mb-1"><strong>Reset:</strong> Delete <code className="text-xs bg-slate-100 px-1 rounded">logs/</code> directory to clear all job state</p>
      </div>
    </Card>
  );
}
