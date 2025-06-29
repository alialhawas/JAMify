import pandas as pd
import requests
import httpx

from fastapi import HTTPException

from sklearn.pipeline import Pipeline
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
 
from annoy import AnnoyIndex

from src.database.postgres.index import get_db_conn, release_db_conn ,insert_top_artists, insert_top_tracks
from src.database.redis.index import get_redis

data: pd.DataFrame = None
song_cluster_pipeline: Pipeline =  Pipeline([
        ('scaler', StandardScaler()),
        ('kmeans', KMeans(n_clusters=20, verbose=False))
    ])
annoy_index: AnnoyIndex = None
index_map: dict = {}

number_cols = ['valence', 'year', 'acousticness', 'danceability', 'duration_ms',
               'energy', 'explicit', 'instrumentalness', 'key', 'liveness',
               'loudness', 'mode', 'popularity', 'speechiness', 'tempo']



def search_song_on_spotify(song_name: str, artist: str = "", access_token: str = "") -> dict:
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    query = f"track:{song_name}"
    if artist:
        query += f" artist:{artist}"
    
    url = f"https://api.spotify.com/v1/search?q={requests.utils.quote(query)}&type=track&limit=1"
    res = requests.get(url, headers=headers)
    
    if res.status_code != 200:
        return {}

    items = res.json().get("tracks", {}).get("items", [])
    return items[0] if items else {}


# all or this based on the paper of 2002 music an dprosnlitic
def generate_music_personality(avg_features: dict) -> str:
    energy = avg_features["energy"]
    valence = avg_features["valence"]
    danceability = avg_features["danceability"]
    acousticness = avg_features["acousticness"]
    instrumentalness = avg_features["instrumentalness"]

    if energy > 0.7 and valence > 0.6:
        return "🌞 Cheerful Optimist"
    elif valence < 0.3 and acousticness > 0.5:
        return "🌧️ Reflective Soul"
    elif instrumentalness > 0.4 and danceability > 0.5:
        return "🧭 Musical Explorer"
    elif energy > 0.6 and acousticness < 0.3:
        return "🔥 Energetic Adventurer"
    else:
        return "🌀 Deep Thinker"


def map_mood(valence, energy):
    if valence > 0.6 and energy > 0.6:
        return "🌞 Cheerful Optimist"
    elif valence < 0.4 and energy < 0.4:
        return "🌧️ Reflective Soul"
    elif energy > 0.7 and valence < 0.5:
        return "🔥 Energetic Explorer"
    elif valence > 0.7 and energy < 0.4:
        return "💭 Daydreamer"
    else:
        return "🌙 Balanced Listener"


def describe_sonic_palette(avg_features):
    result = []

    if avg_features["acousticness"] > 0.5:
        result.append("Warm & Organic")
    elif avg_features["acousticness"] < 0.2:
        result.append("Electronic & Processed")

    if avg_features["instrumentalness"] > 0.5:
        result.append("Instrumental-heavy")
    else:
        result.append("Vocal-focused")

    if avg_features["valence"] > 0.7:
        result.append("Bright & Cheerful")
    elif avg_features["valence"] < 0.3:
        result.append("Melancholic")

    return result


def compute_music_dna(tracks):
    n = len(tracks)
    return {
        "danceable": sum(t.danceability for t in tracks) / n,
        "acoustic": sum(t.acousticness for t in tracks) / n,
        "happy": sum(t.valence for t in tracks) / n,
        "instrumental": sum(t.instrumentalness for t in tracks) / n,
        "energetic": sum(t.energy for t in tracks) / n
    }



def detect_evolution(tracks):
    first = tracks[0]
    last = tracks[-1]
    return {
        "valence_change": round(last.valence - first.valence, 3),
        "energy_change": round(last.energy - first.energy, 3),
        "danceability_change": round(last.danceability - first.danceability, 3),
    }


def user_tracks(user_id: str, time_range: str = "long_term") -> dict:
    redis_con = get_redis()
    access_token = redis_con.get(f"spotify:{user_id}:access_token")

    if not access_token:
        raise HTTPException(status_code=401, detail="User not authenticated")

    time_range = time_range.lower()

    valid_ranges = {"short_term", "medium_term", "long_term"}

    if time_range not in valid_ranges:
        raise HTTPException(status_code=400, detail=f"Invalid time_range: {time_range}")

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    params = {
        "time_range": time_range,
        "limit": 50 # defult 20
    }

    res = requests.get("https://api.spotify.com/v1/me/top/tracks", headers=headers, params=params)

    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.json())
    
    track_data = res.json()

    tracks = track_data.get("items", []) 

    conn = get_db_conn()
    insert_top_tracks(user_id, tracks, time_range, conn)
    release_db_conn(conn)


async def user_artiest(user_id: str, time_range: str = "long_term"):
    redis_con = get_redis()
    access_token = redis_con.get(f"spotify:{user_id}:access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="User not authenticated")

    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"time_range": time_range, "limit": 50}

    async with httpx.AsyncClient() as client:
        res = await client.get("https://api.spotify.com/v1/me/top/artists", headers=headers, params=params)

    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.json())


    artist_data = res.json()
 
    artist = artist_data.get("items", []) 

    conn = get_db_conn()
    insert_top_artists(user_id, artist ,time_range, conn)
    release_db_conn(conn)




