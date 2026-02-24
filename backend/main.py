"""
Main Entry Point - Hexagonal Architecture
Wiring e avvio dell'applicazione
"""
from infrastructure import settings, DIContainer
from adapters.input import create_fastapi_app


container = DIContainer(settings)
text_processor = container.get_text_processor()

app = create_fastapi_app(text_processor)

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
