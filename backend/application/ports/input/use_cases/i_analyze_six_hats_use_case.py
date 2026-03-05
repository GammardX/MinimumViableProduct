"""
Use Case Interface: Analyze Six Hats

Definisce il contratto per l'analisi con metodo Six Thinking Hats.
"""

from abc import ABC, abstractmethod

from domain.models import LLMResult, TextDocument


class IAnalyzeSixHatsUseCase(ABC):
    """
    Use Case Interface: Analizza con metodo Six Thinking Hats
    
    Definisce il contratto per l'analisi di testo secondo le sei prospettive
    del metodo Six Thinking Hats di Edward de Bono.
    
    Cappelli:
    - Bianco: Fatti e dati oggettivi
    - Rosso: Emozioni e intuizioni
    - Nero: Cautela, rischi, giudizio critico
    - Giallo: Ottimismo, benefici, opportunità
    - Verde: Creatività, nuove idee, alternative
    - Blu: Organizzazione, controllo del processo
    
    Pattern: Interface (Port)
    Layer: Application (Ports/Input/Use Cases)
    """
    
    @abstractmethod
    async def analyze_six_hats(
        self, 
        document: TextDocument, 
        hat: str
    ) -> LLMResult:
        """
        Analizza documento secondo prospettiva del cappello specificato
        
        Args:
            document: Documento da analizzare (TextDocument entity)
            hat: Colore cappello che identifica la prospettiva di analisi
                 Valori ammessi: "bianco", "rosso", "nero", "giallo", "verde", "blu"
            
        Returns:
            LLMResult: Oggetto contenente analisi dalla prospettiva specificata
            
        Note:
            Non solleva eccezioni. Tutti gli errori sono incapsulati in LLMResult.
        """
        pass