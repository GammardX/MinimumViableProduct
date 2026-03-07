def test_generate_flow_returns_llm_result_and_calls_processor(client, mock_text_processor):
    response = client.post(
        "/llm/generate",
        json={
            "prompt": "Scrivi una introduzione",
            "context_text": "Contesto della nota",
            "word_count": 180,
        },
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["status"] == "success"
    assert response.json()["data"]["rewritten_text"] == "generated output"
    mock_text_processor.generate.assert_awaited_once_with(
        "Scrivi una introduzione",
        "Contesto della nota",
        180,
    )


def test_generate_flow_validation_error_when_prompt_is_missing(client):
    response = client.post(
        "/llm/generate",
        json={"context_text": "Contesto della nota", "word_count": 180},
    )

    assert response.status_code == 422
