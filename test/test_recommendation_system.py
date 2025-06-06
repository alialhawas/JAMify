import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def startup_model():
    # Ensures FastAPI's startup event is triggered before tests
    with client:
        yield


def test_recommend_song():
    response = client.post("/recommend", json={
        "songs": [{"name": "Shut Up and Dance", "year": 2014}],
        "n_songs": 5
    })

    assert response.status_code == 200
    print(response.json())
    result = response.json()
    assert "recommendations" in result
    assert isinstance(result["recommendations"], list)
    assert len(result["recommendations"]) <= 5
    for song in result["recommendations"]:
        assert "name" in song
        assert "year" in song
        assert "artists" in song


def test_recommend_song_not_found():
    response = client.post("/recommend", json={
        "songs": [{"name": "This Song Does Not Exist", "year": 1900}],
        "n_songs": 5
    })

    assert response.status_code == 400
    assert "detail" in response.json()
    assert "None of the input songs" in response.json()["detail"]


def test_invalid_request_structure():
    response = client.post("/recommend", json={
        "songs": [{"title": "Missing Name Field"}]
    })

    assert response.status_code == 422  # Unprocessable Entity due to validation error


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}



