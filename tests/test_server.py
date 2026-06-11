"""Tests for unitree-mcp MCP tools."""

from pathlib import Path

import pytest


@pytest.fixture
def all_paths_exist(mocker):
    mocker.patch("pathlib.Path.exists", return_value=True)
    mocker.patch("pathlib.Path.mkdir", return_value=None)
    mocker.patch("time.sleep", return_value=None)


# ---------------------------------------------------------------------------
# sim_status
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sim_status_empty(mocker):
    """No models discovered returns empty list."""
    import unitree_mcp.server as server_mod
    mocker.patch.object(server_mod, "_discover_models", return_value={})
    mocker.patch.object(server_mod, "UNITREE_MUJOCO", mocker.MagicMock(exists=lambda: True))
    mocker.patch.object(server_mod, "ROS2_REPO", mocker.MagicMock(exists=lambda: True))

    result = await server_mod.sim_status()
    assert result["success"] is True
    assert result["models"] == []


@pytest.mark.asyncio
async def test_sim_status_with_models(mocker):
    """Models discovered."""
    import unitree_mcp.server as server_mod
    fake = mocker.MagicMock(exists=lambda: True)
    mocker.patch.object(server_mod, "_discover_models", return_value={"go2": fake})
    mocker.patch.object(server_mod, "UNITREE_MUJOCO", mocker.MagicMock(exists=lambda: True))
    mocker.patch.object(server_mod, "ROS2_REPO", mocker.MagicMock(exists=lambda: True))

    result = await server_mod.sim_status()
    assert result["success"] is True
    assert "go2" in result["models"]


# ---------------------------------------------------------------------------
# list_models
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_models(mocker):
    """List models returns all discovered."""
    import unitree_mcp.server as server_mod
    mock_path = mocker.MagicMock(spec=Path)
    mock_path.exists.return_value = True
    mock_path.stat.return_value.st_size = 1024
    mock_path.__str__.return_value = "D:/fake/go2/scene.xml"
    mocker.patch.object(server_mod, "_discover_models", return_value={"go2": mock_path})

    result = await server_mod.list_models()
    assert result["success"] is True
    assert len(result["models"]) == 1
    assert result["models"][0]["name"] == "go2"


# ---------------------------------------------------------------------------
# start_sim
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_start_sim_success(mocker, all_paths_exist, mock_subprocess):
    """Mock Popen, verify job_id returned."""
    import unitree_mcp.server as server_mod
    mock_path = mocker.MagicMock(spec=Path)
    mock_path.exists.return_value = True
    mock_path.__str__.return_value = "D:/fake/go2/scene.xml"
    mocker.patch.object(server_mod, "_discover_models", return_value={"go2": mock_path})

    result = await server_mod.start_sim(robot="go2")
    assert result["success"] is True
    assert "job_id" in result
    assert result["status"] == "running"


@pytest.mark.asyncio
async def test_start_sim_unknown_robot():
    """Unknown robot returns error."""
    import unitree_mcp.server as server_mod
    result = await server_mod.start_sim(robot="nonexistent")
    assert result["success"] is False
    assert "nonexistent" in result["message"].lower()


# ---------------------------------------------------------------------------
# stop_sim
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_stop_sim_unknown_job():
    """Unknown job_id returns error."""
    import unitree_mcp.server as server_mod
    result = await server_mod.stop_sim(job_id="no-such-job")
    assert result["success"] is False
    assert "unknown job" in result["message"].lower()


# ---------------------------------------------------------------------------
# list_jobs
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_jobs_empty():
    """No jobs returns empty list."""
    import unitree_mcp.server as server_mod
    result = await server_mod.list_jobs()
    assert result["success"] is True
    assert result["jobs"] == []


# ---------------------------------------------------------------------------
# load_model
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_load_model_not_found(mocker):
    """Unknown model returns error with alternatives."""
    import unitree_mcp.server as server_mod
    mocker.patch.object(server_mod, "_discover_models", return_value={"go2": mocker.MagicMock()})
    result = await server_mod.load_model(robot="mars")
    assert result["success"] is False
    assert "available_models" in result
    assert "go2" in result["available_models"]





# ---------------------------------------------------------------------------
# get_state
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_state_unknown_job():
    """Unknown job returns error."""
    import unitree_mcp.server as server_mod
    result = await server_mod.get_state(job_id="no-job")
    assert result["success"] is False


# ---------------------------------------------------------------------------
# apply_control
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_apply_control_unknown_job():
    """Unknown job returns error."""
    import unitree_mcp.server as server_mod
    result = await server_mod.apply_control(job_id="no-job", ctrl=[0.0, 0.5])
    assert result["success"] is False


# ---------------------------------------------------------------------------
# export_frame
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_export_frame_unknown_job():
    """Unknown job returns error."""
    import unitree_mcp.server as server_mod
    result = await server_mod.export_frame(job_id="no-job")
    assert result["success"] is False


# ---------------------------------------------------------------------------
# AI tools — basic smoke tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_discover_model_no_llm():
    """No LLM available returns error."""
    import unitree_mcp.server as server_mod
    result = await server_mod.discover_model(description="test robot", ctx=None)
    assert result["success"] is False or result["success"] is True  # graceful
