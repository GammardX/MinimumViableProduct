"""
Use Case: Generate Text
Genera testo basato su un prompt dell'utente
"""
from domain.models import LLMResult, ResultStatus, ResultCode
from application.ports.output import ILLMProvider, IPromptBuilder, IResponseParser


class GenerateTextUseCase:
    """Use Case per generare testo"""
    
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
        prompt: str,
        context_text: str = "",
        word_count: int = 300
    ) -> LLMResult:
        """Esegue la generazione di testo"""
        
        if not prompt or prompt.strip() == "":
            return LLMResult(
                status=ResultStatus.INVALID_INPUT,
                code=ResultCode.EMPTY_PROMPT,
                violation_category="Il prompt non può essere vuoto"
            )
        
        messages = self._prompt_builder.build_generate_prompt(
            prompt, 
            context_text, 
            word_count
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