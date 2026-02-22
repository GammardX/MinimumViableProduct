# MinimumViableProduct
Repository contenente MVP sviluppato dal gruppo GammardX

# Documentazione
Tutta la documentazione relativa al progetto può essere visionata nella seguente repository: https://github.com/GammardX/Documents

# Prerequisiti

## Avere un file .env dentro la cartella backend
File di esempio

```bash
# Chiave api
LLM_API_KEY=xx-xxxxxxxxxxxxxxxxxaxxxxx

# Url Api
LLM_API_URL=http://sito:porta/v1/chat/completions

# Modello
LLM_MODEL=gpt-oss:20b
```

# Usando docker
Nella root del progetto esegui il comando:
```cmd
docker compose up --build
```

# Per spegnere
Nel terminale premere Ctrl+C oppure "docker compose down"
