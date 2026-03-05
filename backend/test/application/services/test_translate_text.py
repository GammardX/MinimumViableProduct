from unittest.mock import AsyncMock, MagicMock

import pytest
from domain.models import LLMResult, ResultStatus, TextDocument

from backend.application.services.translate_text_service import \
    TranslateTextService


@pytest.fixture
def use_case():
    # Creiamo i mock per le porte di output
    llm_provider = AsyncMock()
    prompt_builder = MagicMock()
    response_parser = MagicMock()
    
    return TranslateTextService(llm_provider, prompt_builder, response_parser), llm_provider, prompt_builder, response_parser

@pytest.mark.asyncio
async def test_translate_empty_document_returns_invalid(use_case):
    uc, _, _, _ = use_case
    doc = TextDocument(content="   ") # Documento vuoto
    
    result = await uc.translate_text(doc, "en")
    
    assert result.status == ResultStatus.INVALID_INPUT
    assert result.code.value == "EMPTY_TEXT"

@pytest.mark.asyncio
async def test_translate_llm_failure_returns_technical_error(use_case):
    uc, llm, builder, _ = use_case
    doc = TextDocument(content="Ciao")
    builder.build_translate_prompt.return_value = ["messaggio"]
    
    # Simuliamo un errore di rete/API
    llm.generate_completion.side_effect = Exception("API Connection Timeout")
    
    result = await uc.translate_text(doc, "en")
    
    assert result.status == ResultStatus.ERROR
    assert "API Connection Timeout" in result.violation_category

@pytest.mark.asyncio
async def test_translate_full_flow_success(use_case):
    uc, llm, builder, parser = use_case
    doc = TextDocument(content="Buongiorno")
    
    # Setup dei mock
    builder.build_translate_prompt.return_value = [{"role": "user", "content": "..."}]
    llm.generate_completion.return_value = "Raw AI Response"
    expected_final_result = LLMResult(status=ResultStatus.SUCCESS, code="OK", rewritten_text="Good morning")
    parser.parse_response.return_value = expected_final_result
    
    result = await uc.translate_text(doc, "en")
    
    # Verifichiamo la catena di montaggio
    builder.build_translate_prompt.assert_called_once()
    llm.generate_completion.assert_called_once()
    parser.parse_response.assert_called_with("Raw AI Response")
    assert result == expected_final_result