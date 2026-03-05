from unittest.mock import AsyncMock, MagicMock

import pytest
from domain.models import LLMResult, ResultCode, ResultStatus, TextDocument

from backend.application.services.improve_text_service import \
    ImproveTextService


@pytest.fixture
def mocks():
    return {
        "llm": AsyncMock(),
        "builder": MagicMock(),
        "parser": MagicMock()
    }

@pytest.fixture
def use_case(mocks):
    return ImproveTextService(
        llm_provider=mocks["llm"],
        prompt_builder=mocks["builder"],
        response_parser=mocks["parser"]
    )

@pytest.mark.asyncio
async def test_improve_empty_document(use_case):
    """Verifica che un documento vuoto restituisca INVALID_INPUT"""
    doc = TextDocument(content="   ")
    result = await use_case.execute(doc)
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert result.code == ResultCode.EMPTY_TEXT

@pytest.mark.asyncio
async def test_improve_criterion_fallback(use_case, mocks):
    """
    Verifica che se il criterio è vuoto, venga usato 
    'chiarezza e stile professionale'
    """
    doc = TextDocument(content="Testo da migliorare")
    mocks["builder"].build_improve_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.return_value = "raw"
    
    # Eseguiamo con criterio vuoto
    await use_case.execute(doc, criterion="  ")
    
    # Verifichiamo che il builder sia stato chiamato con il default
    mocks["builder"].build_improve_prompt.assert_called_once_with(
        doc, "chiarezza e stile professionale"
    )

@pytest.mark.asyncio
async def test_improve_success_flow(use_case, mocks):
    """Verifica il flusso completo con un criterio specifico"""
    doc = TextDocument(content="Testo")
    criterion = "rendilo più poetico"
    
    mocks["builder"].build_improve_prompt.return_value = ["prompt_poetico"]
    mocks["llm"].generate_completion.return_value = "risposta_ai"
    expected = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK, rewritten_text="Poesia")
    mocks["parser"].parse_response.return_value = expected
    
    result = await use_case.execute(doc, criterion=criterion)
    
    mocks["builder"].build_improve_prompt.assert_called_with(doc, criterion)
    assert result == expected

@pytest.mark.asyncio
async def test_improve_llm_error_handling(use_case, mocks):
    """Verifica la gestione delle eccezioni del provider LLM"""
    doc = TextDocument(content="Testo")
    mocks["builder"].build_improve_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.side_effect = Exception("Errore di rete")
    
    result = await use_case.execute(doc)
    
    assert result.status == ResultStatus.ERROR
    assert result.code == ResultCode.TECHNICAL_ERROR
    assert "Errore di rete" in result.violation_category