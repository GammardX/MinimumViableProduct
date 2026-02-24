"""
Output Adapter: LLM Client
Implementazione concreta per comunicazione con LLM API
"""
import httpx
import json
from typing import List, Dict, AsyncGenerator
from application.ports.output import ILLMProvider


class LLMClientAdapter(ILLMProvider):
    """Adapter per il client LLM con supporto streaming"""
    
    def __init__(self, providers: List[Dict]):
        self._providers = providers
        self._timeout = 120.0

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = None, 
        temperature: float = 0.1
    ) -> str:
        
        last_error = None

        for provider in self._providers:
            if not provider["url"] or not provider["model"]:
                print(f"[{provider['name']}] Saltato: Variabili non configurate", flush=True)
                continue
            
            if provider["requires_key"] and not provider["key"]:
                print(f"[{provider['name']}] Saltato: API Key mancante", flush=True)
                continue

            try:
                print(f"Tento la generazione con: {provider['name']} (Modello: {provider['model']})", flush=True)
                
                full_content = []
                async for chunk in self._call_api_stream(
                    provider["url"], messages, provider["model"], provider["key"], temperature
                ):
                    full_content.append(chunk)
                
                return "".join(full_content)
                
            except Exception as e:
                print(f"[{provider['name']}] Fallito: {str(e)}. Passo al prossimo fallback...", flush=True)
                last_error = e

        raise Exception(f"Nessun servizio AI disponibile. Ultimo errore: {str(last_error)}")
    
    async def _call_api_stream(
        self,
        url: str,
        messages: List[Dict[str, str]],
        model: str,
        key: str = None,
        temperature: float = 0.1
    ) -> AsyncGenerator[str, None]:
        """Chiamata HTTP all'API con streaming"""
        
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            request_body = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": True 
            }

            if "11434" in url or "zucchetti" in url:
                request_body["options"] = {
                    "num_ctx": 4096,  
                    "num_gpu": 999, 
                    "num_thread": 8  
                }

            headers = {"Content-Type": "application/json"}
            if key:
                headers["Authorization"] = f"Bearer {key}"
            
            async with client.stream(
                "POST",
                url,
                headers=headers,
                json=request_body,
            ) as response:
                response.raise_for_status()
                
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
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
                            
    async def generate_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.1
    ) -> AsyncGenerator[str, None]:
        """Implementazione obbligatoria per lo streaming con fallback"""
        last_error = None
        
        for provider in self._providers:
            if not provider["url"] or not provider["model"]:
                continue
            if provider["requires_key"] and not provider["key"]:
                continue
                
            try:
                async for chunk in self._call_api_stream(
                    provider["url"], messages, provider["model"], provider["key"], temperature
                ):
                    yield chunk
                return
                
            except Exception as e:
                print(f"[{provider['name']}] Streaming fallito: {str(e)}. Passo al prossimo fallback...", flush=True)
                last_error = e
                
        raise Exception(f"Nessun servizio AI disponibile per lo streaming. Ultimo errore: {str(last_error)}")

    async def validate_connection(self) -> bool:
        """
        Implementazione obbligatoria del contratto.
        Per ora restituiamo sempre True, visto che il nostro fallback 
        garantisce che proveremo tutte le connessioni al momento della chiamata.
        """
        return True