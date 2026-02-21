from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LLM_API_URL: str
    LLM_MODEL: str
    LLM_API_KEY: str

    class Config:
        env_file = ".env"
        extra = "forbid" 

settings = Settings()
