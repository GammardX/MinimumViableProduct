def test_health_flow_returns_server_status(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Server is awake!",
        "architecture": "hexagonal",
    }
