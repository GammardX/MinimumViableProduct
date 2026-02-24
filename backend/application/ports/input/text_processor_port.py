"""
Primary Port (Input): Text Processor
Interfaccia per le operazioni di elaborazione testo
"""
from abc import ABC, abstractmethod
from domain.models import TextDocument, LLMResult


class ITextProcessor(ABC):
    """Primary Port - interfaccia per le operazioni di text processing"""
    
    @abstractmethod
    async def summarize(
        self, 
        document: TextDocument, 
        percentage: int
    ) -> LLMResult:
        """
        Riassume un documento
        
        Args:
            document: Documento da riassumere
            percentage: Percentuale di riduzione (10-90)
            
        Returns:
            LLMResult: Risultato dell'operazione
        """
        pass
    
    @abstractmethod
    async def improve(
        self, 
        document: TextDocument, 
        criterion: str
    ) -> LLMResult:
        """
        Migliora un documento secondo un criterio
        
        Args:
            document: Documento da migliorare
            criterion: Criterio di miglioramento
            
        Returns:
            LLMResult: Risultato dell'operazione
        """
        pass
    
    @abstractmethod
    async def translate(
        self, 
        document: TextDocument, 
        target_language: str
    ) -> LLMResult:
        """
        Traduce un documento
        
        Args:
            document: Documento da tradurre
            target_language: Lingua di destinazione
            
        Returns:
            LLMResult: Risultato dell'operazione
        """
        pass
    
    @abstractmethod
    async def analyze_six_hats(
        self, 
        document: TextDocument, 
        hat: str
    ) -> LLMResult:
        """
        Analizza un documento con il metodo dei sei cappelli
        
        Args:
            document: Documento da analizzare
            hat: Cappello da utilizzare (bianco, rosso, nero, giallo, verde, blu)
            
        Returns:
            LLMResult: Risultato dell'analisi
        """
        pass
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        context_text: str = "",
        word_count: int = 300
    ) -> LLMResult:
        """
        Genera testo basato su un prompt
        
        Args:
            prompt: Richiesta dell'utente
            
        Returns:
            LLMResult: Risultato della generazione
        """
        pass
