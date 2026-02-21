from typing import Optional
from pydantic import BaseModel

class Outcome(BaseModel):
    status: str
    code: str
    violation_category: Optional[str] = None

class Data(BaseModel):
    rewritten_text: Optional[str] = None 
    detected_language: Optional[str] = None

class LLMResponse(BaseModel):
    outcome: Outcome
    data: Optional[Data] = None