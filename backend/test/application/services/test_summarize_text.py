from unittest.mock import AsyncMock, MagicMock

import pytest
from domain.models import LLMResult, ResultCode, ResultStatus, TextDocument

from backend.application.services.summarize_text_service import \
    SummarizeTextService


@pytest.fixture
def mocks():
    """Fixture per creare i mock delle dipendenze (porte)"""
    return {
        "llm": AsyncMock(),
        "builder": MagicMock(),
        "parser": MagicMock()
    }

@pytest.fixture
def use_case(mocks):
    """Fixture per inizializzare lo Use Case con i mock"""
    return SummarizeTextService(
        llm_provider=mocks["llm"],
        prompt_builder=mocks["builder"],
        response_parser=mocks["parser"]
    )

@pytest.mark.asyncio
async def test_summarize_invalid_percentage_low(use_case):
    """Testa il limite inferiore della percentuale (9%)"""
    doc = TextDocument(content="Testo valido")
    result = await use_case.summarize_text(doc, percentage=9)
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert "La percentuale deve essere tra 10 e 90" in result.violation_category

@pytest.mark.asyncio
async def test_summarize_invalid_percentage_high(use_case):
    """Testa il limite superiore della percentuale (91%)"""
    doc = TextDocument(content="Testo valido")
    result = await use_case.summarize_text(doc, percentage=91)
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert result.code == ResultCode.EMPTY_TEXT # Nota: il tuo codice usa EMPTY_TEXT anche qui

@pytest.mark.asyncio
async def test_summarize_empty_document(use_case):
    """Verifica il comportamento con documento vuoto"""
    doc = TextDocument(content="   ")
    result = await use_case.summarize_text(doc, percentage=30)
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert result.code == ResultCode.EMPTY_TEXT

@pytest.mark.asyncio
async def test_summarize_success_flow(use_case, mocks):
    """Verifica il successo dell'intera catena di esecuzione"""
    # ARRANGE
    doc = TextDocument(content="Testo lungo da riassumere")
    mocks["builder"].build_summarize_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.return_value = "raw text"
    expected = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK, rewritten_text="Riassunto")
    mocks["parser"].parse_response.return_value = expected
    
    # ACT
    result = await use_case.summarize_text(doc, percentage=50)
    
    # ASSERT
    mocks["builder"].build_summarize_prompt.assert_called_once_with(doc, 50)
    mocks["llm"].generate_completion.assert_called_once()
    assert result == expected

@pytest.mark.asyncio
async def test_summarize_llm_exception(use_case, mocks):
    """Verifica la cattura di eccezioni durante la chiamata al provider"""
    doc = TextDocument(content="Testo")
    mocks["builder"].build_summarize_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.side_effect = Exception("Timeout API")
    
    result = await use_case.summarize_text(doc)
    
    assert result.status == ResultStatus.ERROR
    assert "Timeout API" in result.violation_category