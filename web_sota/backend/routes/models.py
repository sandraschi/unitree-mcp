import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter

from unitree_mcp.server import list_models, load_model

router = APIRouter(tags=["Models"], prefix="/api/models")


@router.get("/")
async def get_list_models():
    return await list_models()


@router.get("/{robot}")
async def get_load_model(robot: str):
    return await load_model(robot=robot)
