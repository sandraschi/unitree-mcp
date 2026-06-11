# unitree-mcp

FastMCP 3.2 wrapper for Unitree Robotics open-source stack.

## Tools

**Simulation (9):** sim_status, load_model, start_sim, stop_sim, get_state, apply_control, list_models, list_jobs, export_frame

**AI (5):** agentic_sim_workflow, natural_language_control, analyze_sim_state, analyze_sim_logs, discover_model

## Supported Robots

Go2, Go2W, B2, B2W, H1, H1-2, G1, H2, A2, R1

## Quick Start

```powershell
uv sync
uv run pytest tests/ -q
uv run python -m unitree_mcp
```

Web dashboard: `.\web_sota\start.ps1` → http://127.0.0.1:11053
