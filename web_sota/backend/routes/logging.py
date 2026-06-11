from fastapi import APIRouter

router = APIRouter(tags=["Logging"], prefix="/api/logs")


@router.get("/")
async def get_logs():
    return {"logs": [], "message": "Log retrieval coming soon"}
