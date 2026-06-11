# Sim Setup — unitree-mcp

## Prerequisites

1. **Clone Unitree repos** (already at `D:\Dev\repos\external\`):
   - `unitree_mujoco` — MuJoCo models + Python sim
   - `unitree_ros` — ROS 1 packages
   - `unitree_ros2` — ROS 2 (Humble) packages
   - `go2_ros2_sdk` — Go2 ROS 2 SDK (optional, may be at abizovnuralem/go2_ros2_sdk)

2. **Install MuJoCo**:
   ```powershell
   uv pip install mujoco
   ```

## Available Robots

| Name | Type | scene.xml |
|------|------|-----------|
| go2 | Quadruped | unitree_robots/go2/scene.xml |
| go2w | Quadruped (wheel) | unitree_robots/go2w/scene.xml |
| b2 | Quadruped | unitree_robots/b2/scene.xml |
| b2w | Quadruped (wheel) | unitree_robots/b2w/scene.xml |
| h1 | Humanoid | unitree_robots/h1/scene.xml |
| h1_2 | Humanoid v2 | unitree_robots/h1_2/scene.xml |
| g1 | Humanoid | unitree_robots/g1/scene.xml |
| h2 | Humanoid | unitree_robots/h2/scene.xml |
| a2 | Quadruped | unitree_robots/a2/scene.xml |
| r1 | Robot arm | unitree_robots/r1/scene.xml |

## Usage

```powershell
# Start MCP server (stdio)
uv run python -m unitree_mcp

# Start web dashboard
.\web_sota\start.ps1

# Run tests
uv run pytest tests/ -q
```
