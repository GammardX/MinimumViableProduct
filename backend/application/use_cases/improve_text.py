"""
Use Case: Improve Text
Migliora un documento testuale secondo un criterio
"""
from domain.models import TextDocument, LLMResult, ResultStatus, ResultCode
from application.ports.output import ILLMProvider, IPromptBuilder, IResponseParser


class ImproveTextUseCase:
    """Use Case per migliorare testo"""
    
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
        criterion: str = "chiarezza e stile professionale"
    ) -> LLMResult:
        """
        Esegue il miglioramento del documento
        
        Args:
            document: Documento da migliorare
            criterion: Criterio di miglioramento
            
        Returns:
            LLMResult: Risultato dell'operazione
        """
        
        if document.is_empty():
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT
            )
        
        if not criterion or criterion.strip() == "":
            criterion = "chiarezza e stile professionale"
        
        messages = self._prompt_builder.build_improve_prompt(
            document, 
            criterion
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
