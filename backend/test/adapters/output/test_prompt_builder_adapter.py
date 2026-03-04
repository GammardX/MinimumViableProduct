import pytest
from adapters.output.prompt_builder_adapter import PromptBuilderAdapter
from domain.models import TextDocument

@pytest.fixture
def builder():
    return PromptBuilderAdapter()

def test_build_summarize_prompt_contains_variables(builder):
    """Verifica che il prompt di riassunto includa la percentuale e il testo"""
    doc = TextDocument(content="Questo è un testo di prova.")
    percentage = 50
    
    messages = builder.build_summarize_prompt(doc, percentage)
    
    # Verifichiamo la struttura (System + User)
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    
    # Verifichiamo che i parametri siano stati iniettati
    user_content = messages[1]["content"]
    assert str(percentage) in user_content
    assert "Questo è un testo di prova." in user_content
    # Verifica protezione XML
    assert "<text_to_process>" in user_content

def test_build_six_hats_specific_instruction(builder):
    """Verifica che il cappello 'nero' carichi le istruzioni di cautela"""
    doc = TextDocument(content="Idea di business")
    
    messages = builder.build_six_hats_prompt(doc, "nero")
    system_content = messages[0]["content"]
    
    assert "CAPPELLO NERO" in system_content.upper()
    assert "avvocato del diavolo" in system_content.lower()

def test_build_generate_prompt_with_context(builder):
    """Verifica che la generazione includa il contesto se fornito"""
    prompt = "Scrivi un articolo"
    context = "Usa uno stile amichevole"
    
    messages = builder.build_generate_prompt(prompt, context_text=context, word_count=100)
    user_content = messages[1]["content"]
    
    assert "<context>" in user_content
    assert context in user_content
    assert "100" in messages[0]["content"] # Word count nel system prompt

def test_build_translate_target_language(builder):
    """Verifica che la lingua di destinazione sia corretta nel prompt"""
    doc = TextDocument(content="Hello")
    target = "Italiano"
    
    messages = builder.build_translate_prompt(doc, target)
    
    assert target in messages[1]["content"]
    assert "motore di traduzione AI" in messages[0]["content"]