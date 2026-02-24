"""
Input Adapter: FastAPI
Adapter per esposizione API REST con FastAPI
"""
import asyncio
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Coroutine, Any

from application.ports.input import ITextProcessor
from domain.models import TextDocument


# ========== DTOs (Data Transfer Objects) ==========

class SummarizeRequest(BaseModel):
    text: str
    percentage: int = 30


class ImproveRequest(BaseModel):
    text: str
    criterion: str = "chiarezza e stile professionale"


class TranslateRequest(BaseModel):
    text: str
    targetLanguage: str


class SixHatsRequest(BaseModel):
    text: str
    hat: str


class GenerateRequest(BaseModel):
    prompt: str
    context_text: str = ""
    word_count: int = 300


# ========== Factory Function ==========

def create_fastapi_app(text_processor: ITextProcessor) -> FastAPI:
    """
    Factory per creare l'app FastAPI configurata
    
    Args:
        text_processor: Implementazione del text processor (domain service)
        
    Returns:
        FastAPI: App configurata e pronta all'uso
    """
    
    app = FastAPI(
        title="ProofOfConcept API - Hexagonal Architecture",
        description="Text processing API con architettura esagonale",
        version="2.0.0"
    )
    
    # ========== CORS Configuration ==========
    
    env_origins = os.getenv("ALLOWED_ORIGINS")
    
    if env_origins:
        origins = env_origins.split(",")
    else:
        origins = [
            "http://localhost:5173",
            "http://localhost:8000",
            "http://localhost:4173",
            "http://127.0.0.1:5173",
            "http://padova.zucchetti.it:14000",
            "https://gammardx.github.io"
        ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # ========== Helpers ==========
    
    async def run_with_disconnect_check(request: Request, coro: Coroutine) -> Any:
        """
        Esegue la chiamata controllando ogni mezzo secondo
        se l'utente ha chiuso la connessione
        """
        llm_task = asyncio.create_task(coro)
        
        async def watch_disconnect():
            while True:
                if await request.is_disconnected():
                    return True
                await asyncio.sleep(0.5)
        
        disconnect_task = asyncio.create_task(watch_disconnect())
        
        done, pending = await asyncio.wait(
            [llm_task, disconnect_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        if disconnect_task in done and disconnect_task.result() is True:
            llm_task.cancel()
            raise asyncio.CancelledError("Client disconnected")
        
        disconnect_task.cancel()
        return llm_task.result()

    async def process_llm_request(request: Request, coro: Coroutine) -> dict:
        """
        Helper centrale per l'esecuzione dei task LLM.
        Gestisce le disconnessioni, mappa le eccezioni in errori HTTP e formatta il risultato.
        """
        try:
            result = await run_with_disconnect_check(request, coro)
            return result.to_dict()
        except asyncio.CancelledError:
            print("Chiamata annullata dal client frontend.")
            raise
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Errore del servizio AI: {str(e)}"
            )
            
    # ========== Endpoints ==========
    
    @app.post("/llm/summarize")
    async def summarize(payload: SummarizeRequest, request: Request):
        """Riassume un testo riducendone la lunghezza"""
        document = TextDocument(content=payload.text)
        return await process_llm_request(
            request, 
            text_processor.summarize(document, payload.percentage)
        )
    
    @app.post("/llm/improve")
    async def improve(payload: ImproveRequest, request: Request):
        """Migliora un testo secondo un criterio"""
        document = TextDocument(content=payload.text)
        return await process_llm_request(
            request, 
            text_processor.improve(document, payload.criterion)
        )
    
    @app.post("/llm/translate")
    async def translate(payload: TranslateRequest, request: Request):
        """Traduce un testo in un'altra lingua"""
        document = TextDocument(content=payload.text)
        return await process_llm_request(
            request, 
            text_processor.translate(document, payload.targetLanguage)
        )
    
    @app.post("/llm/six-hats")
    async def six_hats(payload: SixHatsRequest, request: Request):
        """Analizza un testo con il metodo dei sei cappelli"""
        document = TextDocument(content=payload.text)
        return await process_llm_request(
            request, 
            text_processor.analyze_six_hats(document, payload.hat)
        )
    
    @app.post("/llm/generate")
    async def generate(payload: GenerateRequest, request: Request):
        """Genera testo basato su un prompt"""
        return await process_llm_request(
            request, 
            text_processor.generate(
                payload.prompt, 
                payload.context_text, 
                payload.word_count
            )
        )
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint per verificare stato del server"""
        return {
            "status": "ok",
            "message": "Server is awake!",
            "architecture": "hexagonal"
        }
    
    return app