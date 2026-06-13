# unitree-mcp

**Unitree[^1] robots via MCP: Go2 quadruped, H1/H1-2/G1 humanoids. MuJoCo sim, ROS 2.**

[![CI](https://github.com/sandraschi/unitree-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sandraschi/unitree-mcp/actions/workflows/ci.yml)
[![Ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)
[![FastMCP](https://img.shields.io/badge/FastMCP-3.2+-blue)](https://github.com/jlowin/fastmcp)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

unitree-mcp provides MCP tooling for Unitree's entire robot lineup: Go2 quadruped (dog), H1/H1-2 biped, and G1 full-size humanoid. Load pre-tuned MJCF[^2] models into MuJoCo, control joint positions and gait parameters, stream telemetry, and deploy policies — all through 14 MCP tools. The server includes a robot model depot, a gait library, and bridge scripts for ROS 2 and the Unitree SDK.

Built for the fleet simulation pipeline: unitree-mcp models can be consumed by mujoco-mcp for physics, ros-mcp for ROS 2 topic control, and isaac-mcp for GPU-accelerated training.

## Table of Contents

- [Quick Start](#quick-start)
- [Tools](#tools)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Ports](#ports)
- [Footnotes](#footnotes)

## Quick Start

```powershell
# 1. Clone and enter
git clone https://github.com/sandraschi/unitree-mcp
cd unitree-mcp

# 2. Run the MCP server
uv run python -m unitree_mcp

# 3. Or launch the full web dashboard
.\start.ps1
```

## Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | `sim_status` | Health check — robot models loaded, active jobs, ROS 2 bridge status |
| 2 | `load_model` | Load a Unitree robot model (Go2, H1, H1-2, G1) into the depot |
| 3 | `start_sim` | Start simulation with a selected robot model and gait config |
| 4 | `stop_sim` | Stop simulation |
| 5 | `get_state` | Read joint positions, IMU data, foot contact states |
| 6 | `apply_control` | Apply joint targets or gait commands (velocity, stance height, step frequency) |
| 7 | `list_models` | List all Unitree robot models in the depot with config metadata |
| 8 | `list_jobs` | List active and completed simulation jobs |
| 9 | `export_frame` | Export a render frame as PNG |
| 10 | `agentic_sim_workflow` | Multi-step robot workflow via LLM sampling |
| 11 | `natural_language_control` | Control the robot via natural language ("walk forward slowly") |
| 12 | `analyze_sim_state` | Gait analysis — foot clearance, joint torque limits, stability margin |
| 13 | `analyze_sim_logs` | Parse sim logs for gait failures, motor saturation, contact loss |
| 14 | `discover_model` | Search and download Unitree models and gait configs |

[Full tool reference →](docs/TOOLS.md)

## Architecture

unitree-mcp wraps one of three backends: MuJoCo (default), Gazebo (via ros-mcp bridge), or the real Unitree SDK (`unitree_sdk2` for hardware). The robot model depot stores MJCF configs pre-tuned for each Unitree variant. Gait patterns are parameterized (stance height, step frequency, swing amplitude) and can be swapped at runtime.

```
MCP Client  ──►  unitree-mcp (FastMCP 3.2)
                        │
              ┌─────────┴──────────────┐
              │  Gait Controller        │
              │  (parameterized gaits)  │
              └─────────┬──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  MuJoCo Backend   Gazebo Bridge   Unitree SDK
  (mujoco-mcp)     (ros-mcp)       (hardware)
```

[Architecture deep-dive →](docs/SIM_SETUP.md)

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/TOOLS.md` | Full reference for all 14 tools with inputs, outputs, examples |
| `docs/SETUP.md` | Installation, Unitree SDK setup, gait configuration, troubleshooting |
| `docs/SIM_SETUP.md` | Backend selection, ROS 2 bridge config, hardware bringup |

## Ports

| Port | Service |
|------|---------|
| 11052 | FastAPI backend + MCP HTTP |
| 11053 | Vite React frontend |

## Footnotes

[^1]: **Unitree** — Leading Chinese robotics company. Products: Go2 quadruped, H1/H1-2 biped, G1 humanoid. [unitree.com](https://unitree.com)
[^2]: **MJCF** — MuJoCo XML Format. The native model format for MuJoCo physics. Pre-tuned MJCF models for Unitree robots ship with this repo.
