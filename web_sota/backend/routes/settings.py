from fastapi import APIRouter

router = APIRouter(tags=["Settings"], prefix="/api/settings")


@router.get("/")
async def get_settings():
    return {"external_dir": "D:/Dev/repos/external"}
