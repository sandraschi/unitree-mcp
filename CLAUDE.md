# unitree-mcp — Agent Context

## What this is
FastMCP 3.2 wrapper for Unitree Robotics open-source stack (Go2, H1, H1-2, G1, B2, etc.).
14 tools (9 sim + 5 AI). MuJoCo simulations run as managed background processes.

## Key paths
- `src/unitree_mcp/server.py` — all 14 MCP tools
- `web_sota/backend/server.py` — FastAPI backend (port 11052)
- `web_sota/src/` — React frontend (port 11053)
- `external/` — D:\Dev\repos\external\ (unitree_mujoco, unitree_ros, unitree_ros2)

## Commands
- `uv run pytest tests/ -q` — run tests
- `ruff check src/ web_sota/backend/` — lint
- `uv run python -m unitree_mcp` — start MCP stdio
- `.\web_sota\start.ps1` — full web dashboard

## Robots
go2, go2w, b2, b2w, h1, h1_2, g1, h2, a2, r1 — scene.xml in unitree_robots/
