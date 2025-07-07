from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

sample_tracks = {
    "tracks": [
        {
            "danceability": 0.7,
            "energy": 0.8,
            "valence": 0.75,
            "acousticness": 0.1,
            "instrumentalness": 0.0,
            "tempo": 120.0,
            "speechiness": 0.05,
            "liveness": 0.2
        },
        {
            "danceability": 0.6,
            "energy": 0.85,
            "valence": 0.8,
            "acousticness": 0.2,
            "instrumentalness": 0.0,
            "tempo": 122.0,
            "speechiness": 0.04,
            "liveness": 0.3
        }
    ]
}


def test_mirror_personality():
    response = client.post("/mirror/personality", json=sample_tracks)
    assert response.status_code == 200
    data = response.json()
    assert "personality" in data
    assert "average_features" in data


def test_mirror_mood():
    response = client.post("/mirror/mood", json=sample_tracks)
    assert response.status_code == 200
    data = response.json()
    assert "mood" in data
    assert "valence" in data
    assert "energy" in data


def test_mirror_audio_mirror():
    response = client.post("/mirror/audio-mirror", json=sample_tracks)
    assert response.status_code == 200
    data = response.json()
    assert "sonic_palette" in data
    assert isinstance(data["sonic_palette"], list)


def test_mirror_dna():
    response = client.post("/mirror/dna", json=sample_tracks)
    assert response.status_code == 200
    data = response.json()
    assert "danceable" in data
    assert "acoustic" in data
    assert "happy" in data
    assert "instrumental" in data
    assert "energetic" in data


def test_mirror_evolution():
    response = client.post("/mirror/evolution", json=sample_tracks)
    assert response.status_code == 200
    data = response.json()
    assert "valence_change" in data
    assert "energy_change" in data
    assert "danceability_change" in data



def test_top_tracks():
    pass


def test_topa_artiest():
    pass