import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from adapters.output.llm_client_adapter import LLMClientAdapter

@pytest.fixture
def providers():
    return [
        {"name": "Primary", "url": "http://primary.ai", "model": "gpt-1"},
        {"name": "Fallback", "url": "http://fallback.ai", "model": "gpt-2"}
    ]

@pytest.fixture
def adapter(providers):
    return LLMClientAdapter(providers)

@pytest.mark.asyncio
async def test_generate_completion_success_first_try(adapter):
    """Verifica che se il primo provider funziona, restituisca la risposta corretta"""
    # Mock _call_api_stream 
    async def mock_stream(*args, **kwargs):
        yield "Ciao "
        yield "mondo"

    with patch.object(LLMClientAdapter, '_call_api_stream', side_effect=mock_stream):
        result = await adapter.generate_completion([{"role": "user", "content": "hi"}])
        
        assert result == "Ciao mondo"

@pytest.mark.asyncio
async def test_generate_completion_fallback_logic(adapter):
    """Verifica che se il primo fallisce, provi il secondo"""
    call_count = 0

    async def mock_stream_with_fallback(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("Primary Down")
        yield "Risposta da fallback"

    with patch.object(LLMClientAdapter, '_call_api_stream', side_effect=mock_stream_with_fallback):
        result = await adapter.generate_completion([{"role": "user", "content": "hi"}])
        
        assert result == "Risposta da fallback"
        assert call_count == 2 # Conferma che ha provato entrambi

@pytest.mark.asyncio
async def test_all_providers_fail_raises_exception(adapter):
    """Verifica che se tutti i provider falliscono, venga lanciata un'eccezione"""
    with patch.object(LLMClientAdapter, '_call_api_stream', side_effect=Exception("Network Error")):
        with pytest.raises(Exception) as excinfo:
            await adapter.generate_completion([{"role": "user", "content": "hi"}])
        
        assert "Nessun servizio AI disponibile" in str(excinfo.value)

@pytest.mark.asyncio
async def test_validate_connection_always_true(adapter):
    """Verifica il metodo obbligatorio dal contratto"""
    assert await adapter.validate_connection() is True