from domain.models import TextDocument


def test_summarize_flow_returns_llm_result_and_calls_processor(client, mock_text_processor):
    response = client.post(
        "/llm/summarize",
        json={"text": "Contenuto da riassumere", "percentage": 50},
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["status"] == "success"
    assert response.json()["data"]["rewritten_text"] == "summary output"
    mock_text_processor.summarize.assert_awaited_once()

    document_arg, percentage_arg = mock_text_processor.summarize.await_args.args
    assert isinstance(document_arg, TextDocument)
    assert document_arg.content == "Contenuto da riassumere"
    assert percentage_arg == 50


def test_summarize_flow_validation_error_when_text_is_missing(client):
    response = client.post("/llm/summarize", json={"percentage": 40})

    assert response.status_code == 422
