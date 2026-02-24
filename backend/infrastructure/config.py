"""
Infrastructure: Configuration
Gestione configurazione applicazione con Pydantic
"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    LLM_FALLBACK_ORDER: str = "LOCAL"

    class Config:
        env_file = ".env"
        extra = "allow" 
        
settings = Settings()