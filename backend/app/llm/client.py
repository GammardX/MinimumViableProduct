import httpx
import json
from app.config import settings

async def call_llm(messages: list[dict], url: str, model: str, key: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        request_body = {
            "model": model,
            "messages": messages,
            "temperature": 0.1,
            "options": {
                "num_ctx": 4096,  
                "num_gpu": 999, 
                "num_thread": 8  
            },
            "stream": True 
        }

        async with client.stream(
            "POST",
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json=request_body,
        ) as response:
            response.raise_for_status()
            
            full_content = []
            
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    
                    if data_str == "[DONE]":
                        break
                        
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            full_content.append(content)
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

            return "".join(full_content)