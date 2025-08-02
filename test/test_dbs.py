from fastapi.testclient import TestClient
from src.app import app
import pytest
from unittest.mock import patch, MagicMock
from src.database.postgres.index import get_tracks  

client = TestClient(app)


@pytest.fixture
def fake_db_response():
    return [
        ("Song A", "Artist X", "img1a", "img2a", "img3a", 90, 1, "short_term"),
        ("Song B", "Artist Y", "img1b", "img2b", "img3b", 85, 2, "short_term"),
    ]




def test_get_tracks_with_period(fake_db_response):
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = fake_db_response
    mock_cursor.description = [
        ("song_name",), ("artist_name",), ("image1",), ("image2",),
        ("image3",), ("popularity",), ("rank",), ("time_range",)
    ]

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    with patch("src.database.postgres.index.get_db_conn", return_value=mock_conn):
        with patch("src.database.postgres.index.release_db_conn"):
            result = get_tracks("user123", "short_term", all_flag=0)

    assert isinstance(result, list)
    assert result[0]["song_name"] == "Song A"
    assert result[1]["artist_name"] == "Artist Y"
    assert mock_cursor.execute.call_args[0][1] == ("user123", "short_term")

def test_get_tracks_all_flag(fake_db_response):
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = fake_db_response
    mock_cursor.description = [
        ("song_name",), ("artist_name",), ("image1",), ("image2",),
        ("image3",), ("popularity",), ("rank",), ("time_range",)
    ]

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    with patch("src.database.postgres.index.get_db_conn", return_value=mock_conn):
        with patch("src.database.postgres.index.release_db_conn"):
            result = get_tracks("user123", "ignored_period", all_flag=1)

    assert isinstance(result, list)
    assert result[0]["rank"] == 1
    assert mock_cursor.execute.call_args[0][1] == ("user123",)  # Only user_id used



# def test_get_tracks_with_period():

#     result = get_tracks("0s0qawukwtry081f7klzsvlka", "short_term", all_flag=0)

#     assert isinstance(result, list)
#     assert result[0]["song_name"] == "She Doesn't Mind"
#     assert result[1]["artist_name"] == "Rachel Grae"
#     # assert mock_cursor.execute.call_args[0][1] == ("user123", "short_term")
