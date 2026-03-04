import pytest
from unittest.mock import AsyncMock, MagicMock
from domain.services.text_processor import TextProcessorService
from domain.models import TextDocument, LLMResult, ResultStatus, ResultCode

@pytest.fixture
def mock_use_cases():
    """Crea dei mock per tutti i use cases richiesti dal servizio"""
    return {
        "summarize": AsyncMock(),
        "improve": AsyncMock(),
        "translate": AsyncMock(),
        "six_hats": AsyncMock(),
        "generate": AsyncMock()
    }

@pytest.fixture
def service(mock_use_cases):
    """Inizializza il servizio usando i mock invece degli oggetti reali"""
    return TextProcessorService(
        summarize_use_case=mock_use_cases["summarize"],
        improve_use_case=mock_use_cases["improve"],
        translate_use_case=mock_use_cases["translate"],
        six_hats_use_case=mock_use_cases["six_hats"],
        generate_use_case=mock_use_cases["generate"]
    )

@pytest.mark.asyncio
async def test_summarize_calls_correct_use_case(service, mock_use_cases):
    # ARRANGE
    doc = TextDocument(content="Testo da riassumere")
    expected_result = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK)
    mock_use_cases["summarize"].execute.return_value = expected_result
    
    # ACT
    result = await service.summarize(doc, percentage=30)
    
    # ASSERT
    # Verifichiamo che il metodo .execute del mock sia stato chiamato con i parametri giusti
    mock_use_cases["summarize"].execute.assert_called_once_with(doc, 30)
    assert result == expected_result

@pytest.mark.asyncio
async def test_translate_calls_correct_use_case(service, mock_use_cases):
    # ARRANGE
    doc = TextDocument(content="Hello")
    mock_use_cases["translate"].execute.return_value = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK)
    
    # ACT
    await service.translate(doc, target_language="it")
    
    # ASSERT
    mock_use_cases["translate"].execute.assert_called_once_with(doc, "it")