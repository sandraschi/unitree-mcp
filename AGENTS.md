# AGENTS.md — unitree-mcp

## Project Identity
- **Name**: unitree-mcp
- **Purpose**: FastMCP wrapper for Unitree Robotics open-source stack
- **Stack**: FastMCP 3.2+, Python 3.11+, MuJoCo, ROS 2
- **Ports**: 11052 (backend + MCP HTTP), 11053 (Vite dashboard)
- **External repos**: `D:\Dev\repos\external\unitree_mujoco`

## Tools (14)
- **9 Sim**: sim_status, load_model, start_sim, stop_sim, get_state, apply_control, list_models, list_jobs, export_frame
- **5 AI**: agentic_sim_workflow, natural_language_control, analyze_sim_state, analyze_sim_logs, discover_model

## Robots
go2, go2w, b2, b2w, h1, h1_2, g1, h2, a2, r1
