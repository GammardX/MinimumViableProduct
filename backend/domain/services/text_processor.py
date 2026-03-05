"""
Domain Service: Text Processor
Orchestra i use cases per elaborazione testi
"""
from application.ports.input import ITextProcessor
from application.ports.input.use_cases import (IAnalyzeSixHatsUseCase,
                                               IGenerateTextUseCase,
                                               IImproveTextUseCase,
                                               ISummarizeTextUseCase,
                                               ITranslateTextUseCase)
from domain.models import LLMResult, TextDocument


class TextProcessorService(ITextProcessor):
    """Servizio di dominio che orchestra i use cases"""
    
    def __init__(
        self,
        summarize_use_case: ISummarizeTextUseCase,
        improve_use_case: IImproveTextUseCase,
        translate_use_case: ITranslateTextUseCase,
        six_hats_use_case: IAnalyzeSixHatsUseCase,
        generate_use_case: IGenerateTextUseCase
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
        return await self._summarize.summarize_text(document, percentage)
    
    async def improve(
        self, 
        document: TextDocument, 
        criterion: str
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._improve.improve_text(document, criterion)
    
    async def translate(
        self, 
        document: TextDocument, 
        target_language: str
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._translate.translate_text(document, target_language)
    
    async def analyze_six_hats(
        self, 
        document: TextDocument, 
        hat: str
    ) -> LLMResult:
        """Delega al use case specifico"""
        return await self._six_hats.analyze_six_hats(document, hat)
    
    async def generate(
        self,
        prompt: str,
        context_text: str = "",
        word_count: int = 300
    ) -> LLMResult:
        """Delega al use case specifico per la generazione di testo"""
        return await self._generate.generate_text(
            prompt, 
            context_text, 
            word_count
        )