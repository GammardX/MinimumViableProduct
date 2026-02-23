from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 1. LOCALE
    LOCAL_LLM_URL: Optional[str] = None
    LOCAL_LLM_MODEL: Optional[str] = None

    # 2. ZUCCHETTI
    ZUCCHETTI_API_URL: Optional[str] = None
    ZUCCHETTI_MODEL: Optional[str] = None
    ZUCCHETTI_API_KEY: Optional[str] = None

    # 3. GROQ
    GROQ_API_URL: Optional[str] = None
    GROQ_MODEL: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # 4. GOOGLE AI STUDIO (Gemini)
    GOOGLE_API_URL: Optional[str] = None
    GOOGLE_MODEL: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore" 
        
settings = Settings()