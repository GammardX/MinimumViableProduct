"""
Use Case: Translate Text
Traduce un documento in un'altra lingua
"""
from domain.models import TextDocument, LLMResult, ResultStatus, ResultCode
from application.ports.output import ILLMProvider, IPromptBuilder, IResponseParser


class TranslateTextUseCase:
    """Use Case per tradurre testo"""
    
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
        target_language: str
    ) -> LLMResult:
        """
        Esegue la traduzione del documento
        
        Args:
            document: Documento da tradurre
            target_language: Lingua di destinazione
            
        Returns:
            LLMResult: Risultato dell'operazione
        """
        
        if document.is_empty():
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT
            )
        
        if not target_language or target_language.strip() == "":
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT,
                violation_category="Lingua di destinazione non specificata"
            )
        
        messages = self._prompt_builder.build_translate_prompt(
            document, 
            target_language
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
