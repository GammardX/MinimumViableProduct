from domain.models import TextDocument


def test_translate_flow_returns_llm_result_and_calls_processor(client, mock_text_processor):
    response = client.post(
        "/llm/translate",
        json={"text": "Ciao mondo", "targetLanguage": "english"},
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["status"] == "success"
    assert response.json()["data"]["rewritten_text"] == "translated output"
    mock_text_processor.translate.assert_awaited_once()

    document_arg, language_arg = mock_text_processor.translate.await_args.args
    assert isinstance(document_arg, TextDocument)
    assert document_arg.content == "Ciao mondo"
    assert language_arg == "english"


def test_translate_flow_validation_error_when_target_language_missing(client):
    response = client.post("/llm/translate", json={"text": "Ciao mondo"})

    assert response.status_code == 422
