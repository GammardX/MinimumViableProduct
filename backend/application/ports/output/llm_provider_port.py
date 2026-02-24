"""
Secondary Port (Output): LLM Provider
Interfaccia per comunicare con servizi LLM esterni
"""
from abc import ABC, abstractmethod
from typing import List, Dict, AsyncGenerator


class ILLMProvider(ABC):
    """Port per il provider LLM (Secondary Port - driven)"""
    
    @abstractmethod
    async def generate_completion(
        self, 
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.1
    ) -> str:
        """
        Genera una completion dall'LLM
        
        Args:
            messages: Lista di messaggi (system, user, assistant)
            model: Nome del modello da utilizzare
            temperature: Temperatura per la generazione
            
        Returns:
            str: Testo generato dall'LLM
        """
        pass
    
    @abstractmethod
    async def generate_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.1
    ) -> AsyncGenerator[str, None]:
        """
        Genera una completion con streaming
        
        Args:
            messages: Lista di messaggi
            model: Nome del modello
            temperature: Temperatura
            
        Yields:
            str: Chunk di testo generato
        """
        pass
    
    @abstractmethod
    async def validate_connection(self) -> bool:
        """
        Verifica la connessione all'LLM
        
        Returns:
            bool: True se la connessione è valida
        """
        pass
