"""
Infrastructure: Dependency Injection Container
Wiring di tutte le dipendenze dell'applicazione
"""
from infrastructure.config import Settings
from adapters.output import (
    LLMClientAdapter,
    PromptBuilderAdapter,
    JSONParserAdapter
)
from application.use_cases import (
    SummarizeTextUseCase,
    ImproveTextUseCase,
    TranslateTextUseCase,
    AnalyzeSixHatsUseCase,
    GenerateTextUseCase
)
from domain.services import TextProcessorService


class DIContainer:
    """
    Dependency Injection Container
    Configura e fornisce tutte le dipendenze dell'applicazione
    """
    
    def __init__(self, settings: Settings):
        self._settings = settings
        self._instances = {}

    def _get_providers_list(self):
        """Costruisce la lista dei provider partendo dalle variabili d'ambiente"""
        return [
            {
                "name": "LOCALE",
                "url": self._settings.LOCAL_LLM_URL,
                "model": self._settings.LOCAL_LLM_MODEL,
                "key": None,
                "requires_key": False
            },
            {
                "name": "GROQ",
                "url": self._settings.GROQ_API_URL,
                "model": self._settings.GROQ_MODEL,
                "key": self._settings.GROQ_API_KEY,
                "requires_key": True
            },
            {
                "name": "GOOGLE",
                "url": self._settings.GOOGLE_API_URL,
                "model": self._settings.GOOGLE_MODEL,
                "key": self._settings.GOOGLE_API_KEY,
                "requires_key": True
            },
            {
                "name": "ZUCCHETTI",
                "url": self._settings.ZUCCHETTI_API_URL,
                "model": self._settings.ZUCCHETTI_MODEL,
                "key": self._settings.ZUCCHETTI_API_KEY,
                "requires_key": True
            },
        ]
    
    def get_text_processor(self) -> TextProcessorService:
        if "text_processor" not in self._instances:
            
            providers = self._get_providers_list()
            llm_provider = LLMClientAdapter(providers=providers)
            
            prompt_builder = PromptBuilderAdapter()
            response_parser = JSONParserAdapter()
            
            summarize_uc = SummarizeTextUseCase(llm_provider, prompt_builder, response_parser)
            improve_uc = ImproveTextUseCase(llm_provider, prompt_builder, response_parser)
            translate_uc = TranslateTextUseCase(llm_provider, prompt_builder, response_parser)
            six_hats_uc = AnalyzeSixHatsUseCase(llm_provider, prompt_builder, response_parser)
            generate_uc = GenerateTextUseCase(llm_provider, prompt_builder, response_parser)
            
            self._instances["text_processor"] = TextProcessorService(
                summarize_use_case=summarize_uc,
                improve_use_case=improve_uc,
                translate_use_case=translate_uc,
                six_hats_use_case=six_hats_uc,
                generate_use_case=generate_uc
            )
        
        return self._instances["text_processor"]