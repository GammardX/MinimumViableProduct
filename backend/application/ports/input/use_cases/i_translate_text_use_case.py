"""
Use Case Interface: Translate Text

Definisce il contratto per l'operazione di traduzione.
"""

from abc import ABC, abstractmethod

from domain.models import LLMResult, TextDocument


class ITranslateTextUseCase(ABC):
    """
    Use Case Interface: Traduce testi
    
    Definisce il contratto per l'operazione di traduzione.
    Rileva automaticamente la lingua sorgente e traduce nella lingua target.
    
    Pattern: Interface (Port)
    Layer: Application (Ports/Input/Use Cases)
    """
    
    @abstractmethod
    async def translate_text(
        self, 
        document: TextDocument, 
        target_language: str
    ) -> LLMResult:
        """
        Traduce documento in lingua target
        
        Args:
            document: Documento da tradurre (TextDocument entity)
            target_language: Codice lingua target ISO 639-1
                           Esempi: "en" (inglese), "es" (spagnolo), 
                                  "fr" (francese), "de" (tedesco)
            
        Returns:
            LLMResult: Oggetto contenente:
                - rewritten_text: Testo tradotto
                - detected_language: Lingua sorgente rilevata automaticamente
            
        Note:
            La lingua sorgente viene rilevata automaticamente dall'LLM.
            Non solleva eccezioni. Tutti gli errori sono incapsulati in LLMResult.
        """
        pass