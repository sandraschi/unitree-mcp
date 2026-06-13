# unitree-mcp Setup

## Prerequisites

- Python 3.11+
- `uv` package manager
- MuJoCo (`uv pip install mujoco`)
- Upstream Unitree repos cloned to `external/`

## Installation

```powershell
git clone https://github.com/sandraschi/unitree-mcp.git
cd unitree-mcp
uv sync
uv pip install mujoco

# Clone upstream Unitree MuJoCo models
git clone --depth 1 https://github.com/unitreerobotics/unitree_mujoco.git external/unitree_mujoco

# Optional: ROS 2 SDKs
git clone --depth 1 https://github.com/unitreerobotics/unitree_ros2.git external/unitree_ros2
git clone --depth 1 https://github.com/unitreerobotics/go2_ros2_sdk.git external/go2_ros2_sdk
```

## Simulator Setup

MuJoCo is installed as a Python package — no separate simulator installation needed. The Unitree MuJoCo models come from the upstream repo cloned to `external/unitree_mujoco`.

ROS 2 integration is optional. If you don't need ROS 2 features, only `external/unitree_mujoco` is required.

### Available Robot Models

| Model | Description |
|-------|-------------|
| go2 | Go2 quadruped |
| go2w | Go2 with wheels |
| b2 | B2 quadruped |
| b2w | B2 with wheels |
| h1 | H1 humanoid |
| h1_2 | H1-2 humanoid |
| g1 | G1 humanoid |
| h2 | H2 humanoid |
| a2 | A2 quadruped |
| r1 | R1 wheeled robot |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UNITREE_EXTERNAL_DIR` | `D:/Dev/repos/external` | Directory with upstream Unitree repos |
| `UNITREE_SIM_PYTHON` | `python` | Python interpreter for MuJoCo sims |
| `UNITREE_LOG_DIR` | `D:/Dev/repos/unitree-mcp/logs` | Sim log output directory |
| `FLEET_EXCHANGE_ROOT` | `D:/Dev/repos/_exchange` | Fleet exchange root for export_frame |

### Ports

| Service | Port |
|---------|------|
| Backend (REST + MCP HTTP) | 11052 |
| Frontend (Vite dev) | 11053 |

## Running

### MCP stdio

```powershell
uv run python -m unitree_mcp
```

### Web Dashboard

```powershell
.\web_sota\start.ps1
```

## Testing

```powershell
uv run pytest tests/ -q
ruff check src/ web_sota/backend/
```

## Troubleshooting

### "Unknown robot model" on start_sim

**Cause:** The model directory doesn't exist in `external/unitree_mujoco/unitree_robots/`.  
**Fix:** Run `list_models()` to see available models. Ensure upstream repo is cloned: `Test-Path external/unitree_mujoco`

### "Simulator script not found"

**Cause:** `external/unitree_mujoco/simulate_python/unitree_mujoco.py` is missing.  
**Fix:** Clone the upstream repo with `--depth 1`. Verify the file exists.

### Simulator exits immediately

**Cause:** Missing Python dependency or invalid model XML.  
**Fix:** Check the log file at `logs/sim_<robot>_<job_id>.log`. Ensure `mujoco` is installed: `uv run python -c "import mujoco; print('ok')"`

### ROS 2 tools fail

**Cause:** ROS 2 not installed or the upstream ROS repos not cloned.  
**Fix:** ROS 2 integration is optional — core simulation tools (start_sim, get_state, etc.) don't require it. Install ROS 2 Humble and clone `unitree_ros2` and `go2_ros2_sdk`.

### "mujoco not available" in load_model

**Cause:** The `mujoco` package is not installed.  
**Fix:** `uv pip install mujoco`

### Port 11052/11053 already in use

**Cause:** Another process is bound.  
**Fix:**
```powershell
Get-NetTCPConnection -LocalPort 11052 | ForEach { Stop-Process $_.OwningProcess -Force }
```

### apply_control writes but sim doesn't respond

**Cause:** The upstream Unitree simulator loop may not read control.json depending on the model.  
**Fix:** Check the log for "control file" messages. The sim runner reads control.json each step; verify the actuator count matches.

### Headless mode doesn't work

**Cause:** The upstream Unitree simulator opens a GUI viewer by default.  
**Fix:** Set `headless=True` and ensure `UNITREE_HEADLESS=1` env var is set. Some upstream scripts may still open a window — this is a known upstream limitation.
