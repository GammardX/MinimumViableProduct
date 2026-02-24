"""
Domain Model: TextDocument
Rappresenta un documento testuale da elaborare
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class TextDocument:
    """Entità del dominio che rappresenta un testo da elaborare"""
    content: str
    language: Optional[str] = None
    
    def __post_init__(self):
        """Validazione del contenuto"""
        if self.content is None:
            raise ValueError("Il contenuto non può essere None")
    
    def word_count(self) -> int:
        """Conta le parole nel documento"""
        return len(self.content.split())
    
    def is_empty(self) -> bool:
        """Verifica se il documento è vuoto"""
        return self.content.strip() == ""
    
    def char_count(self) -> int:
        """Conta i caratteri nel documento"""
        return len(self.content)
