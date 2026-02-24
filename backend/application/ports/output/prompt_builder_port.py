"""
Secondary Port (Output): Prompt Builder
Interfaccia per costruire prompt per diverse operazioni
"""
from abc import ABC, abstractmethod
from typing import List, Dict
from domain.models import TextDocument


class IPromptBuilder(ABC):
    """Port per la costruzione dei prompt"""
    
    @abstractmethod
    def build_summarize_prompt(
        self, 
        document: TextDocument, 
        percentage: int
    ) -> List[Dict[str, str]]:
        """
        Costruisce il prompt per riassumere
        
        Args:
            document: Documento da riassumere
            percentage: Percentuale di riduzione
            
        Returns:
            Lista di messaggi per l'LLM
        """
        pass
    
    @abstractmethod
    def build_improve_prompt(
        self, 
        document: TextDocument, 
        criterion: str
    ) -> List[Dict[str, str]]:
        """
        Costruisce il prompt per migliorare
        
        Args:
            document: Documento da migliorare
            criterion: Criterio di miglioramento
            
        Returns:
            Lista di messaggi per l'LLM
        """
        pass
    
    @abstractmethod
    def build_translate_prompt(
        self, 
        document: TextDocument, 
        target_language: str
    ) -> List[Dict[str, str]]:
        """
        Costruisce il prompt per tradurre
        
        Args:
            document: Documento da tradurre
            target_language: Lingua di destinazione
            
        Returns:
            Lista di messaggi per l'LLM
        """
        pass
    
    @abstractmethod
    def build_six_hats_prompt(
        self, 
        document: TextDocument, 
        hat: str
    ) -> List[Dict[str, str]]:
        """
        Costruisce il prompt per analisi sei cappelli
        
        Args:
            document: Documento da analizzare
            hat: Cappello da utilizzare
            
        Returns:
            Lista di messaggi per l'LLM
        """
        pass
    
    @abstractmethod
    def build_generate_prompt(
        self,
        prompt: str,
        context_text: str = "",
        word_count: int = 300
    ) -> List[Dict[str, str]]:
        """
        Costruisce il prompt per generare testo
        
        Args:
            prompt: Richiesta dell'utente
            
        Returns:
            Lista di messaggi per l'LLM
        """
        pass
