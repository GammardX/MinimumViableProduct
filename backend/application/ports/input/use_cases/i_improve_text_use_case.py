"""
Use Case Interface: Improve Text

Definisce il contratto per l'operazione di miglioramento testo.
"""

from abc import ABC, abstractmethod

from domain.models import LLMResult, TextDocument


class IImproveTextUseCase(ABC):
    """
    Use Case Interface: Migliora qualità del testo
    
    Definisce il contratto per l'operazione di miglioramento testuale
    secondo criteri specificati (chiarezza, stile, grammatica, etc.).
    
    Pattern: Interface (Port)
    Layer: Application (Ports/Input/Use Cases)
    """
    
    @abstractmethod
    async def improve_text(
        self, 
        document: TextDocument, 
        criterion: str
    ) -> LLMResult:
        """
        Migliora testo secondo criterio specificato
        
        Args:
            document: Documento da migliorare (TextDocument entity)
            criterion: Criterio di miglioramento da applicare
                      Esempi: "chiarezza e stile professionale", 
                             "grammatica e punteggiatura",
                             "brevità e concisione"
            
        Returns:
            LLMResult: Oggetto contenente testo migliorato o errore
            
        Note:
            Non solleva eccezioni. Tutti gli errori sono incapsulati in LLMResult.
        """
        pass