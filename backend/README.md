# Backend - Hexagonal Architecture (Ports and Adapters)

## 📐 Architettura Esagonale

Questo backend è stato completamente ristrutturato seguendo l'**Architettura Esagonale** (Hexagonal Architecture / Ports and Adapters), un pattern architetturale che garantisce:

✅ **Separazione chiara delle responsabilità**  
✅ **Testabilità completa** (domain indipendente da framework)  
✅ **Flessibilità** (sostituisci facilmente infrastruttura)  
✅ **Indipendenza dai dettagli tecnici** (il core non dipende da FastAPI, httpx, etc.)

---

## 🏗️ Struttura del Progetto

```
backend-hexagonal/
├── domain/                      # 🔵 CORE - Logica di Business
│   ├── models/                  # Entità del dominio
│   │   ├── text_document.py    # TextDocument
│   │   └── llm_result.py        # LLMResult, ResultStatus, ResultCode
│   ├── services/                # Servizi di dominio
│   │   └── text_processor.py   # TextProcessorService
│   └── exceptions.py            # Eccezioni del dominio
│
├── application/                 # 🟢 USE CASES
│   ├── use_cases/               # Casi d'uso (logica applicativa)
│   │   ├── summarize_text.py
│   │   ├── improve_text.py
│   │   ├── translate_text.py
│   │   ├── analyze_six_hats.py
│   │   └── generate_text.py
│   └── ports/                   # INTERFACCE (contratti)
│       ├── input/               # Primary Ports (driving)
│       │   └── text_processor_port.py
│       └── output/              # Secondary Ports (driven)
│           ├── llm_provider_port.py
│           ├── prompt_builder_port.py
│           └── response_parser_port.py
│
├── adapters/                    # 🟡 ADATTATORI (implementazioni)
│   ├── input/                   # Primary Adapters (driving)
│   │   └── fastapi_adapter.py  # API REST
│   └── output/                  # Secondary Adapters (driven)
│       ├── llm_client_adapter.py      # Implementazione LLM con streaming
│       ├── prompt_builder_adapter.py  # Costruzione prompt
│       └── json_parser_adapter.py     # Parsing JSON
│
├── infrastructure/              # 🔴 Infrastruttura
│   ├── config.py               # Configurazione (Pydantic Settings)
│   └── di_container.py         # Dependency Injection
│
├── main.py                     # Entry point
└── requirements.txt
```

---

## 🎯 Principi Architetturali

### 1. Domain (Core)
**Il cuore dell'applicazione**, contiene la logica di business pura:
- **Modelli**: `TextDocument`, `LLMResult`
- **Servizi**: Orchestrazione dei use cases
- **Eccezioni**: Errori specifici del dominio
- ❌ **NON dipende** da FastAPI, httpx, o altri framework

### 2. Application (Use Cases)
**Logica applicativa**, indipendente dai dettagli tecnici:
- **Use Cases**: Un use case per ogni operazione (Summarize, Improve, Translate, Six Hats, Generate)
- **Ports**: Interfacce (contratti) per comunicare con l'esterno
  - **Input Ports**: Come il mondo esterno chiama il nostro core
  - **Output Ports**: Come il nostro core chiama il mondo esterno

### 3. Adapters (Implementazioni)
**Implementazioni concrete** delle interfacce:
- **Input Adapters**: FastAPI (ma potrebbe essere CLI, GraphQL, gRPC...)
- **Output Adapters**: LLM Client, Prompt Builder, JSON Parser

### 4. Infrastructure
**Configurazione e wiring**:
- Settings (da .env)
- Dependency Injection Container

---

## 🔌 Ports and Adapters

### Primary Ports (Input)
```python
class ITextProcessor(ABC):
    async def summarize(document, percentage) -> LLMResult
    async def improve(document, criterion) -> LLMResult
    async def translate(document, target_language) -> LLMResult
    async def analyze_six_hats(document, hat) -> LLMResult
    async def generate(prompt) -> LLMResult
```

### Secondary Ports (Output)
```python
class ILLMProvider(ABC):
    async def generate_completion(messages, model, temperature) -> str
    
class IPromptBuilder(ABC):
    def build_summarize_prompt(document, percentage) -> List[Dict]
    
class IResponseParser(ABC):
    def parse_response(raw_response) -> LLMResult
```

---

## 📊 Flusso di una Richiesta

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP POST /llm/summarize
       ▼
┌─────────────────────────────┐
│  FastAPI Adapter (Input)    │  ← Input Adapter
└──────┬──────────────────────┘
       │ text_processor.summarize()
       ▼
┌─────────────────────────────┐
│  TextProcessorService        │  ← Domain Service
└──────┬──────────────────────┘
       │ use_case.execute()
       ▼
┌─────────────────────────────┐
│  SummarizeTextUseCase        │  ← Use Case
└──┬──────────┬────────────┬──┘
   │          │            │
   │          │            ▼
   │          │       ┌─────────────────┐
   │          │       │ LLMClient       │ ← Output Adapter
   │          │       │ (con streaming) │
   │          │       └────────┬────────┘
   │          │                │
   │          ▼                ▼
   │     ┌───────────┐    ┌────────────┐
   │     │  Prompt   │    │  External  │
   │     │  Builder  │    │  LLM API   │
   │     └───────────┘    └────────────┘
   │
   ▼
┌─────────────┐
│    JSON     │ ← Output Adapter
│   Parser    │
└──────┬──────┘
       │ LLMResult
       ▼
┌─────────────┐
│   Client    │ ← Response
└─────────────┘
```

---

## 🚀 Setup e Avvio

### 1. Prerequisiti
```bash
Python 3.12.x
```

### 2. Crea Virtual Environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

### 3. Installa Dipendenze
```bash
pip install -r requirements.txt
```

### 4. Configura `.env`
Crea un file `.env` nella root:
```env
LLM_API_URL=http://your-llm-endpoint:port/v1/chat/completions
LLM_MODEL=your-model-name
LLM_API_KEY=your-api-key
```

### 5. Avvia il Server
```bash
# Opzione 1: Direttamente con Python
python main.py

# Opzione 2: Con uvicorn (reload automatico)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server disponibile su: `http://localhost:8000`

---

## 🧪 Testing

### Testare il Domain (Unit Tests)
```python
# test_summarize_use_case.py
import pytest
from unittest.mock import Mock, AsyncMock

@pytest.mark.asyncio
async def test_summarize_success():
    # Mock delle dipendenze
    llm_provider = Mock()
    llm_provider.generate_completion = AsyncMock(return_value='{"outcome": ...}')
    
    prompt_builder = Mock()
    response_parser = Mock()
    
    # Use case
    use_case = SummarizeTextUseCase(
        llm_provider, prompt_builder, response_parser, "model"
    )
    
    # Esecuzione
    document = TextDocument(content="Test text")
    result = await use_case.execute(document, 30)
    
    # Assertions
    assert result.is_successful()
```

### Testare gli Adapters
Puoi testare gli adapter in isolamento sostituendo le dipendenze con mock.

---

## 📝 Endpoints API

### 1. POST /llm/summarize
Riassume un testo
```json
{
  "text": "Testo da riassumere...",
  "percentage": 30
}
```

### 2. POST /llm/improve
Migliora un testo
```json
{
  "text": "Testo da migliorare...",
  "criterion": "chiarezza e stile professionale"
}
```

### 3. POST /llm/translate
Traduce un testo
```json
{
  "text": "Text to translate...",
  "targetLanguage": "Italian"
}
```

### 4. POST /llm/six-hats
Analizza con sei cappelli
```json
{
  "text": "Testo da analizzare...",
  "hat": "bianco"
}
```

Cappelli disponibili: `bianco`, `rosso`, `nero`, `giallo`, `verde`, `blu`

### 5. POST /llm/generate
Genera testo da prompt
```json
{
  "prompt": "Scrivi una storia su..."
}
```

### 6. GET /health
Health check
```json
{
  "status": "ok",
  "message": "Server is awake!",
  "architecture": "hexagonal"
}
```

---

## ✅ Vantaggi dell'Architettura Esagonale

### 1. Testabilità
```python
# Testa il domain SENZA bisogno di FastAPI o LLM reale
result = await use_case.execute(document, 30)
assert result.is_successful()
```

### 2. Sostituibilità
Puoi sostituire qualsiasi adapter senza toccare il core:
- FastAPI → CLI / GraphQL / gRPC
- LLM Provider → MockLLM per testing
- JSON Parser → XML Parser / YAML Parser

### 3. Indipendenza
Il domain NON conosce:
- FastAPI
- httpx
- pydantic (tranne per Settings)
- Nessun dettaglio tecnico

### 4. Manutenibilità
Ogni layer ha responsabilità chiare:
- Domain → Business logic
- Application → Use cases
- Adapters → Implementazioni tecniche
- Infrastructure → Configurazione

---

## 🔄 Migrazione dal Vecchio Backend

### Vecchia Struttura
```
backend/
├── app/
│   ├── llm/
│   │   ├── client.py
│   │   ├── parser.py
│   │   ├── prompts.py
│   │   └── schemas.py
│   ├── config.py
│   └── main.py
```

### Mapping alla Nuova Struttura

| Vecchio | Nuovo | Layer |
|---------|-------|-------|
| `llm/schemas.py` | `domain/models/llm_result.py` | Domain |
| `llm/client.py` | `adapters/output/llm_client_adapter.py` | Adapter |
| `llm/parser.py` | `adapters/output/json_parser_adapter.py` | Adapter |
| `llm/prompts.py` | `adapters/output/prompt_builder_adapter.py` | Adapter |
| `main.py` endpoints | `application/use_cases/*.py` | Use Cases |
| `main.py` FastAPI | `adapters/input/fastapi_adapter.py` | Adapter |
| `config.py` | `infrastructure/config.py` | Infrastructure |

---

## 🆕 Funzionalità Mantenute

✅ **Streaming LLM** - Supporto completo per risposte streaming  
✅ **Fallback automatico** - Passa al fallback LLM in caso di errore  
✅ **Gestione disconnessione** - Annulla chiamate se il client si disconnette  
✅ **CORS configurabile** - Origini configurabili via env  
✅ **5 Endpoint** - Tutti e 5 gli endpoint funzionanti (incluso `/llm/generate`)  
✅ **Validazione sicurezza** - Protezione anti-prompt-injection nei prompt

---

## 📚 Ulteriori Estensioni

### Aggiungere un nuovo Use Case
1. Crea `application/use_cases/new_use_case.py`
2. Aggiungi metodo in `ITextProcessor`
3. Implementa in `TextProcessorService`
4. Aggiungi endpoint in `fastapi_adapter.py`

### Aggiungere un nuovo Adapter
1. Definisci l'interfaccia in `application/ports/output/`
2. Implementa in `adapters/output/`
3. Registra nel `DIContainer`

### Aggiungere un nuovo Input Adapter (es. CLI)
1. Crea `adapters/input/cli_adapter.py`
2. Usa `text_processor` dal `DIContainer`
3. Nessuna modifica al domain necessaria!

---

## 📞 Supporto

Per domande sull'architettura o implementazione:
- Consulta i commenti nei file sorgente
- Ogni classe ha docstring dettagliate
- I port hanno definizioni chiare delle interfacce

---

**Versione**: 2.0.0 (Hexagonal Architecture)  
**Data**: Febbraio 2026  
**Pattern**: Ports and Adapters (Hexagonal Architecture)
