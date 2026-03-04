import pytest
from adapters.output.json_parser_adapter import JSONParserAdapter
from domain.models import ResultStatus, ResultCode

@pytest.fixture
def parser():
    return JSONParserAdapter()

def test_parse_perfect_json(parser):
    """Testa il caso ideale: JSON pulito"""
    raw = '{"outcome": {"status": "success", "code": "OK"}, "data": {"rewritten_text": "Ciao"}}'
    result = parser.parse_response(raw)
    
    assert result.status == ResultStatus.SUCCESS
    assert result.rewritten_text == "Ciao"

def test_parse_markdown_json(parser):
    """Testa il caso comune: LLM risponde dentro blocchi Markdown"""
    raw = """
    Ecco il risultato:
    ```json
    {
      "outcome": {"status": "success", "code": "OK"},
      "data": {"rewritten_text": "Testo pulito"}
    }
    ```
    Spero sia utile.
    """
    result = parser.parse_response(raw)
    
    assert result.status == ResultStatus.SUCCESS
    assert result.rewritten_text == "Testo pulito"

def test_parse_invalid_json_fallback(parser):
    """Verifica che il parser gestisca errori di sintassi JSON restituendo un LLMResult di errore"""
    raw = "Questa non è una stringa JSON"
    result = parser.parse_response(raw)
    
    assert result.status == ResultStatus.ERROR
    assert result.code == ResultCode.TECHNICAL_ERROR
    assert "Parse error" in result.violation_category

def test_parse_malformed_enum_values(parser):
    """Verifica il fallback se l'LLM inventa stati o codici non esistenti"""
    raw = '{"outcome": {"status": "inventato", "code": "BOOOH"}}'
    result = parser.parse_response(raw)
    
    # Grazie ai tuoi try-except interni, deve fare il fallback sui default
    assert result.status == ResultStatus.ERROR
    assert result.code == ResultCode.TECHNICAL_ERROR

def test_parse_with_special_characters(parser):
    """Testa la sanitizzazione di newline e tabulazioni (logica interna dell'adapter)"""
    raw = '{"outcome": {"status": "success"}, "data": {"rewritten_text": "Riga 1\nRiga 2"}}'
    result = parser.parse_response(raw)
    
    assert result.status == ResultStatus.SUCCESS
    assert "Riga 1" in result.rewritten_text