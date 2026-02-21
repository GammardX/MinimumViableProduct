import httpx
from app.config import settings

async def call_llm(messages: list[dict], url: str, model: str, key: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.1,
                "options": {
                    "num_ctx": 4096,  
                    "num_gpu": 999, 
                    "num_thread": 8  
                },
                "stream": False 
            },
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]