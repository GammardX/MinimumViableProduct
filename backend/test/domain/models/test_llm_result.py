import pytest
from domain.models.llm_result import LLMResult, ResultStatus, ResultCode

def test_llm_result_is_successful():
    """Verifica che is_successful funzioni correttamente in base allo stato"""
    success_res = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK)
    error_res = LLMResult(status=ResultStatus.ERROR, code=ResultCode.TECHNICAL_ERROR)
    
    assert success_res.is_successful() is True
    assert error_res.is_successful() is False

def test_llm_result_has_result():
    """Verifica che rilevi la presenza o assenza del testo generato"""
    with_text = LLMResult(status=ResultStatus.SUCCESS, code=ResultCode.OK, rewritten_text="Ciao")
    without_text = LLMResult(status=ResultStatus.REFUSAL, code=ResultCode.ETHIC_REFUSAL)
    
    assert with_text.has_result() is True
    assert without_text.has_result() is False

def test_llm_result_to_dict_success():
    """Verifica la serializzazione in caso di successo"""
    res = LLMResult(
        status=ResultStatus.SUCCESS, 
        code=ResultCode.OK, 
        rewritten_text="Testo rielaborato",
        detected_language="it"
    )
    d = res.to_dict()
    
    assert d["outcome"]["status"] == "success"
    assert d["data"]["rewritten_text"] == "Testo rielaborato"
    assert d["data"]["detected_language"] == "it"

def test_llm_result_to_dict_error():
    """Verifica la serializzazione in caso di errore (data deve essere None)"""
    res = LLMResult(
        status=ResultStatus.INVALID_INPUT, 
        code=ResultCode.EMPTY_TEXT,
        violation_category="EmptyContent"
    )
    d = res.to_dict()
    
    assert d["outcome"]["status"] == "INVALID_INPUT"
    assert d["outcome"]["violation_category"] == "EmptyContent"
    assert d["data"] is None  # Importante: se non c'è testo, data è None