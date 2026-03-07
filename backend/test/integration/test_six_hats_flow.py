from domain.models import TextDocument


def test_six_hats_flow_returns_llm_result_and_calls_processor(client, mock_text_processor):
    response = client.post(
        "/llm/six-hats",
        json={"text": "Analizza questo testo", "hat": "Nero"},
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["status"] == "success"
    assert response.json()["data"]["rewritten_text"] == "six hats output"
    mock_text_processor.analyze_six_hats.assert_awaited_once()

    document_arg, hat_arg = mock_text_processor.analyze_six_hats.await_args.args
    assert isinstance(document_arg, TextDocument)
    assert document_arg.content == "Analizza questo testo"
    assert hat_arg == "Nero"


def test_six_hats_flow_maps_runtime_error_to_500(client, mock_text_processor):
    mock_text_processor.analyze_six_hats.side_effect = RuntimeError("provider down")

    response = client.post(
        "/llm/six-hats",
        json={"text": "Analizza questo testo", "hat": "Nero"},
    )

    assert response.status_code == 500
    assert "Errore del servizio AI: provider down" in response.json()["detail"]
