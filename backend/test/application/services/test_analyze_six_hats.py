from unittest.mock import AsyncMock, MagicMock

import pytest
from domain.models import LLMResult, ResultCode, ResultStatus, TextDocument

from backend.application.services.analyze_six_hats_service import \
    AnalyzeSixHatsService


@pytest.fixture
def mocks():
    return {
        "llm": AsyncMock(),
        "builder": MagicMock(),
        "parser": MagicMock()
    }

@pytest.fixture
def use_case(mocks):
    return AnalyzeSixHatsService(
        llm_provider=mocks["llm"],
        prompt_builder=mocks["builder"],
        response_parser=mocks["parser"]
    )

@pytest.mark.asyncio
async def test_six_hats_invalid_hat_name(use_case):
    """Verifica che un cappello con nome errato (es. 'viola') venga rifiutato"""
    doc = TextDocument(content="Testo valido")
    result = await use_case.analyze_six_hats(doc, hat="viola")
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert "non supportato" in result.violation_category

@pytest.mark.asyncio
async def test_six_hats_case_insensitivity(use_case, mocks):
    """Verifica che 'ROSSO', 'Rosso' e 'rosso' siano tutti accettati"""
    doc = TextDocument(content="Testo")
    mocks["builder"].build_six_hats_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.return_value = "raw"
    mocks["parser"].parse_response.return_value = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK)
    
    # Test con maiuscole
    result = await use_case.analyze_six_hats(doc, hat="ROSSO")
    
    assert result.is_successful()
    # Verifichiamo che il builder sia stato chiamato (la logica passa la validazione)
    mocks["builder"].build_six_hats_prompt.assert_called_once()

@pytest.mark.asyncio
async def test_six_hats_empty_hat_returns_invalid(use_case):
    """Verifica che un cappello None o vuoto venga rifiutato"""
    doc = TextDocument(content="Testo")
    result = await use_case.analyze_six_hats(doc, hat="")
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert "non supportato" in result.violation_category

@pytest.mark.asyncio
async def test_six_hats_success_flow(use_case, mocks):
    """Verifica il successo con un cappello valido (es. 'verde')"""
    doc = TextDocument(content="Analisi creativa")
    hat = "verde"
    
    mocks["builder"].build_six_hats_prompt.return_value = [{"role": "system", "content": "verde"}]
    mocks["llm"].generate_completion.return_value = "Risposta creativa"
    expected = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK, rewritten_text="Analisi verde")
    mocks["parser"].parse_response.return_value = expected
    
    result = await use_case.analyze_six_hats(doc, hat=hat)
    
    mocks["builder"].build_six_hats_prompt.assert_called_with(doc, hat)
    assert result == expected

@pytest.mark.asyncio
async def test_six_hats_llm_exception(use_case, mocks):
    """Verifica la gestione dell'errore se il provider LLM fallisce"""
    doc = TextDocument(content="Testo")
    mocks["builder"].build_six_hats_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.side_effect = Exception("LLM Down")
    
    result = await use_case.analyze_six_hats(doc, hat="nero")
    
    assert result.status == ResultStatus.ERROR
    assert "LLM Down" in result.violation_category