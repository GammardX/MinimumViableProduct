"""
Use Case: Summarize Text
Riassume un documento testuale riducendone la lunghezza
"""
from application.ports.output import (ILLMProvider, IPromptBuilder,
                                      IResponseParser)
from domain.models import LLMResult, ResultCode, ResultStatus, TextDocument


class SummarizeTextUseCase:
    """Use Case per riassumere testo"""
    
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
        percentage: int = 30
    ) -> LLMResult:
        """
        Esegue il riassunto del documento
        
        Args:
            document: Documento da riassumere
            percentage: Percentuale di riduzione (10-90)
            
        Returns:
            LLMResult: Risultato dell'operazione
        """
        
        if document.is_empty():
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT
            )
        
        if not 10 <= percentage <= 90:
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_TEXT,
                violation_category=f"La percentuale deve essere tra 10 e 90, ricevuto: {percentage}"
            )
        
        messages = self._prompt_builder.build_summarize_prompt(
            document, 
            percentage
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
