from domain.models import TextDocument


def test_improve_flow_returns_llm_result_and_calls_processor(client, mock_text_processor):
    response = client.post(
        "/llm/improve",
        json={"text": "Testo base", "criterion": "piu formale"},
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["status"] == "success"
    assert response.json()["data"]["rewritten_text"] == "improved output"
    mock_text_processor.improve.assert_awaited_once()

    document_arg, criterion_arg = mock_text_processor.improve.await_args.args
    assert isinstance(document_arg, TextDocument)
    assert document_arg.content == "Testo base"
    assert criterion_arg == "piu formale"


def test_improve_flow_maps_value_error_to_400(client, mock_text_processor):
    mock_text_processor.improve.side_effect = ValueError("bad criterion")

    response = client.post(
        "/llm/improve",
        json={"text": "Testo base", "criterion": "bad"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "bad criterion"
