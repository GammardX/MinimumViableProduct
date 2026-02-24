"""
Infrastructure: Dependency Injection Container
Wiring di tutte le dipendenze dell'applicazione
"""
import os
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
        """Costruisce la lista dei provider dinamicamente in base all'ordine nel .env"""
        providers = []
        
        order_str = os.getenv("LLM_FALLBACK_ORDER", "LOCAL")
        
        order_list = [p.strip().upper() for p in order_str.split(",") if p.strip()]

        for prefix in order_list:
            url = os.getenv(f"{prefix}_URL")
            model = os.getenv(f"{prefix}_MODEL")
            key = os.getenv(f"{prefix}_KEY") 
            
            if not url or not model:
                print(f"[{prefix}] Saltato: URL o Model mancante nel file .env", flush=True)
                continue

            providers.append({
                "name": prefix,
                "url": url,
                "model": model,
                "key": key
            })
            
        return providers
    
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