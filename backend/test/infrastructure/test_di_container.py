import pytest
import os
from unittest.mock import MagicMock
from infrastructure.di_container import DIContainer
from domain.services import TextProcessorService

@pytest.fixture
def mock_settings():
    return MagicMock()

def test_get_providers_list_parsing(mock_settings):
    """Verifica che la lista dei provider venga costruita correttamente dalle env vars"""
    # Simuliamo le variabili d'ambiente
    os.environ["LLM_FALLBACK_ORDER"] = "LOCAL,AZURE"
    os.environ["LOCAL_URL"] = "http://localhost"
    os.environ["LOCAL_MODEL"] = "llama3"
    os.environ["AZURE_URL"] = "http://azure.ai"
    os.environ["AZURE_MODEL"] = "gpt-4"
    
    container = DIContainer(mock_settings)
    providers = container._get_providers_list()
    
    assert len(providers) == 2
    assert providers[0]["name"] == "LOCAL"
    assert providers[1]["name"] == "AZURE"

def test_get_text_processor_is_singleton(mock_settings):
    """Verifica che il container restituisca sempre la stessa istanza (Singleton)"""
    container = DIContainer(mock_settings)
    
    proc1 = container.get_text_processor()
    proc2 = container.get_text_processor()
    
    assert proc1 is proc2  # Verifica l'identità dell'oggetto in memoria

def test_get_text_processor_wiring(mock_settings):
    """Verifica che il processor restituito sia del tipo corretto"""
    container = DIContainer(mock_settings)
    processor = container.get_text_processor()
    
    assert isinstance(processor, TextProcessorService)
    # Verifichiamo che uno dei use case interni sia presente
    assert processor.summarize is not None

def test_get_providers_skips_invalid_configs(mock_settings):
    """Verifica che i provider incompleti vengano saltati senza crashare"""
    os.environ["LLM_FALLBACK_ORDER"] = "INCOMPLETE"
    os.environ["INCOMPLETE_URL"] = "" # URL mancante
    
    container = DIContainer(mock_settings)
    providers = container._get_providers_list()
    
    assert len(providers) == 0