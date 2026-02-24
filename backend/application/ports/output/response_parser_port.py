"""
Secondary Port (Output): Response Parser
Interfaccia per parsing delle risposte LLM
"""
from abc import ABC, abstractmethod
from domain.models import LLMResult


class IResponseParser(ABC):
    """Port per il parsing delle risposte"""
    
    @abstractmethod
    def parse_response(self, raw_response: str) -> LLMResult:
        """
        Converte la risposta raw in un LLMResult
        
        Args:
            raw_response: Stringa JSON ricevuta dall'LLM
            
        Returns:
            LLMResult: Oggetto del dominio con il risultato
        """
        pass
    
    @abstractmethod
    def extract_json(self, text: str) -> dict:
        """
        Estrae JSON da testo con fallback
        
        Args:
            text: Testo contenente JSON
            
        Returns:
            dict: Dizionario estratto
            
        Raises:
            ValueError: Se non si riesce ad estrarre JSON valido
        """
        pass
