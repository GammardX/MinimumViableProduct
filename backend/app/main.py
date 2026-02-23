import os
import asyncio
from app.config import settings
from app.llm.client import call_llm
from app.llm.parser import extract_json
from app.llm.prompts import (improve_prompt, six_hats_prompt, summarize_prompt,
                             translate_prompt, generate_prompt)
from app.llm.schemas import LLMResponse
from fastapi import FastAPI, HTTPException, Request 
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

env_origins = os.getenv("ALLOWED_ORIGINS")

if env_origins:
    origins = env_origins.split(",")
else:
    # Fallback per lo sviluppo locale
    origins = [
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://padova.zucchetti.it:14000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def run_llm_request(messages: list[dict]):
    providers = [
        {
            "name": "LOCALE",
            "url": settings.LOCAL_LLM_URL,
            "model": settings.LOCAL_LLM_MODEL,
            "key": None,
            "requires_key": False
        },
        {
            "name": "ZUCCHETTI",
            "url": settings.ZUCCHETTI_API_URL,
            "model": settings.ZUCCHETTI_MODEL,
            "key": settings.ZUCCHETTI_API_KEY,
            "requires_key": True
        },
        {
            "name": "GROQ",
            "url": settings.GROQ_API_URL,
            "model": settings.GROQ_MODEL,
            "key": settings.GROQ_API_KEY,
            "requires_key": True
        },
        {
            "name": "GOOGLE",
            "url": settings.GOOGLE_API_URL,
            "model": settings.GOOGLE_MODEL,
            "key": settings.GOOGLE_API_KEY,
            "requires_key": True
        }
    ]

    last_error = None

    for provider in providers:
        if not provider["url"] or not provider["model"]:
            print(f"[{provider['name']}] Saltato: Variabili non configurate nel file .env")
            continue
        
        if provider["requires_key"] and not provider["key"]:
            print(f"[{provider['name']}] Saltato: API Key mancante")
            continue

        try:
            print(f"Tento la generazione con: {provider['name']} (Modello: {provider['model']})")
            
            raw = await call_llm(
                messages, 
                provider["url"],
                provider["model"],
                provider["key"]
            )
            return extract_json(raw)
            
        except asyncio.CancelledError:
            print("Chiamata annullata dal client frontend.")
            raise
        except Exception as e:
            print(f"[{provider['name']}] Fallito: {str(e)}. Passo al prossimo fallback...")
            last_error = e

    print("Tutti i provider LLM sono falliti o non configurati.")
    raise HTTPException(
        status_code=500, 
        detail=f"Errore critico: Nessun servizio AI disponibile al momento. Ultimo errore: {str(last_error)}"
    )

async def run_with_disconnect_check(request: Request, coro):
    """
    Esegue la chiamata all'LLM ma controlla ogni mezzo secondo
    se l'utente ha chiuso la connessione (premendo Annulla).
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
        raise asyncio.CancelledError()
        
    disconnect_task.cancel()
    return llm_task.result()

# ENDPOINTS

@app.post("/llm/summarize", response_model=LLMResponse)
async def summarize(payload: dict, request: Request):
    messages = summarize_prompt(payload["text"], payload["percentage"])
    return await run_with_disconnect_check(request, run_llm_request(messages))

@app.post("/llm/improve", response_model=LLMResponse)
async def improve(payload: dict, request: Request):
    messages = improve_prompt(payload["text"], payload["criterion"])
    return await run_with_disconnect_check(request, run_llm_request(messages))

@app.post("/llm/translate", response_model=LLMResponse)
async def translate(payload: dict, request: Request):
    messages = translate_prompt(payload["text"], payload["targetLanguage"])
    return await run_with_disconnect_check(request, run_llm_request(messages))

@app.post("/llm/six-hats", response_model=LLMResponse)
async def six_hats(payload: dict, request: Request):
    messages = six_hats_prompt(payload["text"], payload["hat"])
    return await run_with_disconnect_check(request, run_llm_request(messages))

@app.post("/llm/generate", response_model=LLMResponse)
async def generate(payload: dict, request: Request):
    context_text = payload.get("context_text", "")
    word_count = payload.get("word_count", 300) 
    messages = generate_prompt(payload["prompt"], context_text, word_count)
    return await run_with_disconnect_check(request, run_llm_request(messages))

# risveglia il server
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is awake!"}