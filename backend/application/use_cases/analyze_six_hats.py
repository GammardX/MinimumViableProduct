"""
Use Case: Analyze Six Hats
Analizza un documento con il metodo dei sei cappelli
"""
from domain.models import TextDocument, LLMResult, ResultStatus, ResultCode
from domain.exceptions import UnsupportedHatException
from application.ports.output import ILLMProvider, IPromptBuilder, IResponseParser


class AnalyzeSixHatsUseCase:
    """Use Case per analisi sei cappelli"""
    
    VALID_HATS = ["bianco", "rosso", "nero", "giallo", "verde", "blu"]
    
    def __init__(
        self,
        llm_provider: ILLMProvider,
        prompt_builder: IPromptBuilder,
        response_parser: IResponseParser
    ):
        self._llm_provider = llm_provider
        self._prompt_builder = prompt_builder
        self._response_parser = response_parser
    
    async def execute(
        self, 
        document: TextDocument, 
        hat: str
    ) -> LLMResult:
        """
        Esegue l'analisi del documento con un cappello specifico
        
        Args:
            document: Documento da analizzare
            hat: Cappello da utilizzare (bianco, rosso, nero, giallo, verde, blu)
            
        Returns:
            LLMResult: Risultato dell'analisi
        """
        
        if document.is_empty():
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT
            )
        
        hat_lower = hat.lower() if hat else ""
        if hat_lower not in self.VALID_HATS:
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT,
                violation_category=f"Cappello '{hat}' non supportato. Cappelli validi: {', '.join(self.VALID_HATS)}"
            )
        
        messages = self._prompt_builder.build_six_hats_prompt(
            document, 
            hat
        )
        
        try:
            raw_response = await self._llm_provider.generate_completion(
                messages=messages,
                temperature=0.1
            )
        except Exception as e:
            return LLMResult(
                status=ResultStatus.ERROR,
                code=ResultCode.TECHNICAL_ERROR,
                violation_category=str(e)
            )
        
        result = self._response_parser.parse_response(raw_response)
        
        return result
