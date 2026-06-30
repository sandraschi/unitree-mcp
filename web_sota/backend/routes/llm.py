import httpx
from fastapi import APIRouter

router = APIRouter(tags=["LLM"], prefix="/api/llm")


@router.get("/status")
async def llm_status():
    return {"status": "ok", "provider": "ollama", "url": "http://127.0.0.1:11434"}


@router.post("/chat")
async def llm_chat(body: dict):
    provider = body.get("provider", "ollama")
    model = body.get("model", "llama3.2:3b")
    prompt = body.get("prompt") or body.get("message", "")
    if provider == "lmstudio":
        base = "http://127.0.0.1:1234/v1"
    else:
        base = "http://127.0.0.1:11434/v1"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{base}/chat/completions",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return {"response": data["choices"][0]["message"]["content"]}
            return {"response": f"HTTP {resp.status_code}", "error": resp.text}
    except Exception as e:
        return {"response": f"Error: {e}"}
