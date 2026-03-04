import pytest
from domain.models.text_document import TextDocument

def test_text_document_creation_valid():
    """Verifica che un documento valido venga creato correttamente"""
    doc = TextDocument(content="Ciao mondo", language="it")
    assert doc.content == "Ciao mondo"
    assert doc.language == "it"

def test_text_document_none_content_raises_error():
    """Verifica che venga lanciato un errore se il contenuto è None"""
    with pytest.raises(ValueError, match="Il contenuto non può essere None"):
        TextDocument(content=None)

def test_text_document_word_count():
    """Verifica il conteggio corretto delle parole"""
    doc = TextDocument(content="Uno due tre quattro")
    assert doc.word_count() == 4

def test_text_document_is_empty():
    """Verifica il rilevamento di documenti vuoti o solo spazi"""
    empty_doc = TextDocument(content="")
    spaces_doc = TextDocument(content="   ")
    valid_doc = TextDocument(content="testo")
    
    assert empty_doc.is_empty() is True
    assert spaces_doc.is_empty() is True
    assert valid_doc.is_empty() is False

def test_text_document_char_count():
    """Verifica il conteggio dei caratteri inclusi gli spazi"""
    doc = TextDocument(content="A B")
    assert doc.char_count() == 3