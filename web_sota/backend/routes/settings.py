import os
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(tags=["Settings"], prefix="/api/settings")

# Same default as unitree_mcp.server.EXTERNAL: an "external" dir next to the repo.
_REPO_ROOT = Path(__file__).resolve().parents[3]


@router.get("/")
async def get_settings():
    return {"external_dir": os.getenv("UNITREE_EXTERNAL_DIR", str(_REPO_ROOT.parent / "external"))}
