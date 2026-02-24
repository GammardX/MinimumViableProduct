"""
Domain Service: Text Processor
Orchestra i use cases per elaborazione testi
"""
from application.ports.input import ITextProcessor
from application.use_cases import (
    SummarizeTextUseCase,
    ImproveTextUseCase,
    TranslateTextUseCase,
    AnalyzeSixHatsUseCase,
    GenerateTextUseCase
)
from domain.models import TextDocument, LLMResult


class TextProcessorService(ITextProcessor):
    """Servizio di dominio che orchestra i use cases"""
    
    def __init__(
        self,
        summarize_use_case: SummarizeTextUseCase,
        improve_use_case: ImproveTextUseCase,
        translate_use_case: TranslateTextUseCase,
        six_hats_use_case: AnalyzeSixHatsUseCase,
        generate_use_case: GenerateTextUseCase
    ):
        self._summarize = summarize_use_case
        self._improve = improve_use_case
        self._translate = translate_use_case
        self._six_hats = six_hats_use_case
        self._generate = generate_use_case
    
    async def summarize(
        self, 
        document: TextDocument, 
        percentage: int
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._summarize.execute(document, percentage)
    
    async def improve(
        self, 
        document: TextDocument, 
        criterion: str
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._improve.execute(document, criterion)
    
    async def translate(
        self, 
        document: TextDocument, 
        target_language: str
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._translate.execute(document, target_language)
    
    async def analyze_six_hats(
        self, 
        document: TextDocument, 
        hat: str
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._six_hats.execute(document, hat)
    
    async def generate(
        self,
        prompt: str,
        context_text: str = "",
        word_count: int = 300
    ) -> LLMResult:
        """Delega al use case specifico per la generazione di testo"""
        return await self._generate.execute(
            prompt, 
            context_text, 
            word_count
        )