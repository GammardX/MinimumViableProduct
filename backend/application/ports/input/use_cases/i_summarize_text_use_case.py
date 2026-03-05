"""
Use Case Interface: Summarize Text

Definisce il contratto per l'operazione di riassunto documenti.
"""

from abc import ABC, abstractmethod

from domain.models import LLMResult, TextDocument


class ISummarizeTextUseCase(ABC):
    """
    Use Case Interface: Riassume documenti testuali
    
    Definisce il contratto per l'operazione di summarization.
    Riduce la lunghezza del testo mantenendo le informazioni chiave.
    
    Pattern: Interface (Port)
    Layer: Application (Ports/Input/Use Cases)
    """
    
    @abstractmethod
    async def execute(
        self, 
        document: TextDocument, 
        percentage: int
    ) -> LLMResult:
        """
        Esegue riassunto del documento
        
        Args:
            document: Documento da riassumere (TextDocument entity)
            percentage: Percentuale di riduzione desiderata (range: 10-90)
                       Es: 30 significa ridurre a circa il 70% della lunghezza originale
            
        Returns:
            LLMResult: Oggetto contenente:
                - status: SUCCESS, INVALID_INPUT, REFUSAL, ERROR
                - code: OK, EMPTY_TEXT, MANIPULATION_ATTEMPT, TECHNICAL_ERROR
                - rewritten_text: Testo riassunto (se success)
                - detected_language: Lingua rilevata
                - violation_category: Dettagli errore (se presente)
            
        Note:
            Non solleva eccezioni. Tutti gli errori sono incapsulati in LLMResult.
        """
        pass