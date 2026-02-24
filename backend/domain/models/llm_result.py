"""
Domain Model: LLMResult
Rappresenta il risultato di un'elaborazione LLM
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ResultStatus(Enum):
    """Stati possibili del risultato"""
    SUCCESS = "success"
    REFUSAL = "refusal"
    INVALID_INPUT = "INVALID_INPUT"
    ERROR = "error"


class ResultCode(Enum):
    """Codici di risultato"""
    OK = "OK"
    EMPTY_TEXT = "EMPTY_TEXT"
    EMPTY_PROMPT = "EMPTY_PROMPT"
    MANIPULATION_ATTEMPT = "MANIPULATION_ATTEMPT"
    MANIPULATION = "MANIPULATION"
    ETHIC_REFUSAL = "ETHIC_REFUSAL"
    TECHNICAL_ERROR = "TECHNICAL_ERROR"


@dataclass
class LLMResult:
    """Risultato dell'elaborazione LLM"""
    status: ResultStatus
    code: ResultCode
    rewritten_text: Optional[str] = None
    detected_language: Optional[str] = None
    violation_category: Optional[str] = None
    
    def is_successful(self) -> bool:
        """Verifica se l'elaborazione è riuscita"""
        return self.status == ResultStatus.SUCCESS
    
    def has_result(self) -> bool:
        """Verifica se c'è un testo risultante"""
        return self.rewritten_text is not None
    
    def to_dict(self) -> dict:
        """Converte in dizionario per serializzazione"""
        return {
            "outcome": {
                "status": self.status.value,
                "code": self.code.value,
                "violation_category": self.violation_category
            },
            "data": {
                "rewritten_text": self.rewritten_text,
                "detected_language": self.detected_language
            } if self.has_result() else None
        }
