"""
Use Case Interface: Generate Text

Definisce il contratto per la generazione di testo originale.
"""

from abc import ABC, abstractmethod

from domain.models import LLMResult


class IGenerateTextUseCase(ABC):
    """
    Use Case Interface: Genera testo originale da prompt
    
    Definisce il contratto per l'operazione di generazione testo.
    Crea contenuto originale basato sul prompt fornito dall'utente.
    
    Pattern: Interface (Port)
    Layer: Application (Ports/Input/Use Cases)
    """
    
    @abstractmethod
    async def generate_text(self, prompt: str) -> LLMResult:
        """
        Genera testo originale basato su prompt
        
        Args:
            prompt: Richiesta utente per generazione testo
                   Es: "Scrivi una breve storia su un robot",
                       "Crea un email formale di presentazione",
                       "Genera una lista di idee per un progetto"
            
        Returns:
            LLMResult: Oggetto contenente testo generato
            
        Note:
            Utilizza temperatura più alta (0.7) per favorire creatività.
            Non solleva eccezioni. Tutti gli errori sono incapsulati in LLMResult.
        """
        pass