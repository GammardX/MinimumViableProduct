from app.config import settings
from app.llm.client import call_llm
from app.llm.parser import extract_json
from app.llm.prompts import (improve_prompt, six_hats_prompt, summarize_prompt,
                             translate_prompt)
from app.llm.schemas import LLMResponse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:4173",    
    "http://127.0.0.1:5173",    
    "https://gammardX.github.io/ProofOfConcept",
    "https://gammardx.github.io",
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
    try:
        raw = await call_llm(
            messages, 
            settings.LLM_API_URL,
            settings.LLM_MODEL,
            settings.LLM_API_KEY,
        )
    except Exception as e:
        print(f"Primary LLM failed: {e}. Switching to fallback.")
        raw = await call_llm(
            messages, 
            "http://padova.zucchetti.it:14000/v1/chat/completions",
            "gpt-oss:20b",
            settings.LLM_API_KEY,
        )
    return extract_json(raw)

# ENDPOINTS

@app.post("/llm/summarize", response_model=LLMResponse)
async def summarize(payload: dict):
    messages = summarize_prompt(payload["text"], payload["percentage"])
    return await run_llm_request(messages)



@app.post("/llm/improve", response_model=LLMResponse)
async def improve(payload: dict):
    messages = improve_prompt(payload["text"], payload["criterion"])
    return await run_llm_request(messages)


@app.post("/llm/translate", response_model=LLMResponse)
async def translate(payload: dict):
    messages = translate_prompt(payload["text"], payload["targetLanguage"])
    return await run_llm_request(messages)


@app.post("/llm/six-hats", response_model=LLMResponse)
async def six_hats(payload: dict):
    messages = six_hats_prompt(payload["text"], payload["hat"])

    return await run_llm_request(messages)

# risveglia il server
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is awake!"}