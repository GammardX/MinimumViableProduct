import pytest
from unittest.mock import AsyncMock, MagicMock
from application.use_cases.generate_text import GenerateTextUseCase
from domain.models import LLMResult, ResultStatus, ResultCode

@pytest.fixture
def mocks():
    return {
        "llm": AsyncMock(),
        "builder": MagicMock(),
        "parser": MagicMock()
    }

@pytest.fixture
def use_case(mocks):
    return GenerateTextUseCase(
        llm_provider=mocks["llm"],
        prompt_builder=mocks["builder"],
        response_parser=mocks["parser"]
    )

@pytest.mark.asyncio
async def test_generate_empty_prompt_returns_invalid(use_case):
    """Verifica che un prompt vuoto o composto da soli spazi venga rifiutato"""
    result = await use_case.execute(prompt="   ")
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert result.code == ResultCode.EMPTY_PROMPT
    assert "Il prompt non può essere vuoto" in result.violation_category

@pytest.mark.asyncio
async def test_generate_success_with_context(use_case, mocks):
    """Verifica il flusso con prompt, contesto e word count personalizzato"""
    # ARRANGE
    prompt = "Scrivi una mail"
    context = "L'utente è un manager"
    words = 150
    
    mocks["builder"].build_generate_prompt.return_value = [{"role": "user", "content": "..."}]
    mocks["llm"].generate_completion.return_value = "Risposta AI"
    expected = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK, rewritten_text="Mail generata")
    mocks["parser"].parse_response.return_value = expected
    
    # ACT
    result = await use_case.execute(prompt=prompt, context_text=context, word_count=words)
    
    # ASSERT
    # Verifichiamo che il builder riceva tutti i parametri corretti
    mocks["builder"].build_generate_prompt.assert_called_once_with(prompt, context, words)
    assert result == expected

@pytest.mark.asyncio
async def test_generate_uses_default_values(use_case, mocks):
    """Verifica che vengano usati i valori di default per contesto e word_count"""
    prompt = "Genera un'idea"
    
    await use_case.execute(prompt=prompt)
    
    # Il word_count di default nel tuo codice è 300
    mocks["builder"].build_generate_prompt.assert_called_once_with(prompt, "", 300)

@pytest.mark.asyncio
async def test_generate_handles_llm_exception(use_case, mocks):
    """Verifica la resilienza in caso di crash del provider LLM"""
    mocks["builder"].build_generate_prompt.return_value = ["prompt"]
    mocks["llm"].generate_completion.side_effect = Exception("Quota API esaurita")
    
    result = await use_case.execute(prompt="Test")
    
    assert result.status == ResultStatus.ERROR
    assert result.code == ResultCode.TECHNICAL_ERROR
    assert "Quota API esaurita" in result.violation_category