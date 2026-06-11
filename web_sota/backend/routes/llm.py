from fastapi import APIRouter

router = APIRouter(tags=["LLM"], prefix="/api/llm")


@router.get("/status")
async def llm_status():
    return {"status": "ok", "provider": "ollama", "url": "http://127.0.0.1:11434"}
