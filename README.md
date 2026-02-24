# MinimumViableProduct
Repository contenente MVP sviluppato dal gruppo GammardX

# Documentazione
Tutta la documentazione relativa al progetto può essere visionata nella seguente repository: https://github.com/GammardX/Documents

# Prerequisiti

## Avere un file .env dentro la cartella backend
File di esempio

```bash
# Ordine tentativi ...
LLM_FALLBACK_ORDER=LOCAL,GROQ,GOOGLE

# LOCALE
LOCAL_URL=http://host.docker.internal:11434/v1/chat/completions
LOCAL_MODEL=modello

# 2. GROQ
GROQ_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=modello
GROQ_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. GOOGLE
GOOGLE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
GOOGLE_MODEL=modello
GOOGLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

# Usando docker
Nella root del progetto esegui il comando:
```cmd
docker compose up --build
```

# Per spegnere
Nel terminale premere Ctrl+C oppure "docker compose down"
