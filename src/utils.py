import pandas as pd
import requests
import asyncio
import httpx
import os
import jwt



import statistics
from typing import Dict

from jwt import ExpiredSignatureError, InvalidTokenError

from functools import partial
from datetime import datetime, timedelta

from fastapi import HTTPException

from sklearn.pipeline import Pipeline
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
 
from annoy import AnnoyIndex

from src.database.postgres.index import get_db_conn, release_db_conn, insert_top_artists, insert_top_tracks
from src.database.redis.index import get_redis

from src.song_Gen.youTfileCreateor import download_song_sample_by_name, load_clips

from src.database.postgres.index import get_tracks, get_top_artists

from slowapi.util import get_remote_address
from fastapi import Request

from src.schemas import MusicPersonality


JWT_SECRET =  os.getenv("JWT_SECRET") 
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
ENV = os.getenv('ENV')

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


# TODO add the paper music and persnialy to the docs for refrnce
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

    token_data = redis_con.hgetall(f"spotify:{user_id}:tokens")

    if not token_data:
        raise HTTPException(status_code=401, detail="Spotify token not found in Redis")

    access_token = token_data['access_token']

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
        raise HTTPException(status_code=res.status_code, detail="Failed to fetch top tracks from Spotify")
    
    track_data = res.json()

    tracks = track_data.get("items", []) 

    conn = get_db_conn()
    insert_top_tracks(user_id, tracks, time_range, conn)
    release_db_conn(conn)

    if ENV != "dev":
        load_clips(tracks[:20], redis_con)
    


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


async def async_download_song_sample_by_name(song_name: str, artist_name: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(download_song_sample_by_name, song_name, artist_name))


async def asyncget_preview(songs: list[dict]) -> list[str]:
    tasks = [
        async_download_song_sample_by_name(song["song_name"], song["artist_name"])
        for song in songs
    ]
    return await asyncio.gather(*tasks)

def create_jwt(user_id: str):
    expiration = datetime.utcnow() + timedelta(hours=2)
    payload = {
        "user_id": user_id,
        "exp": expiration  
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token



def get_user_id_from_jwt(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        return user_id
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(request: Request) -> str:
    token = (
        request.cookies.get("jwt") or  # from cookie
        request.headers.get("Authorization", "").replace("Bearer ", "")  # or from header
    )

    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    return decode_jwt(token)


def decode_jwt(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def user_key_func(request: Request):
    return request.state.user_id or get_remote_address(request)


def get_audio_features(top_tracks: pd.DataFrame) -> dict:

    if top_tracks is None or len(top_tracks) == 0:
        return []

    top_df = pd.DataFrame(top_tracks)

    # Create a copy of the data DataFrame to work with
    data_copy = data.copy()
    
    # Extract the first artist from the artists list string in the data
    # Handle the string representation of lists like "['Artist1', 'Artist2']"
    def extract_first_artist(artists_str):
        if pd.isna(artists_str) or not isinstance(artists_str, str):
            return None
        try:
            # Remove quotes and brackets, split by comma, and get the first artist
            artists_str = artists_str.strip()
            if artists_str.startswith('[') and artists_str.endswith(']'):
                artists_str = artists_str[1:-1]  # Remove brackets
            # Split by comma and clean up quotes and spaces
            artists = [artist.strip().strip("'\"") for artist in artists_str.split(',')]
            return artists[0] if artists else None
        except:
            return None
    
    # Apply the function to extract first artist
    data_copy['first_artist'] = data_copy['artists'].apply(extract_first_artist)
    
    # Join using the first artist name
    filtered_top_tracks = pd.merge(
        top_df,
        data_copy,
        how="inner",
        left_on=["song_name", "artist_name"],
        right_on=["name", "first_artist"]
    )

    return filtered_top_tracks.to_dict(orient="records")


def compute_mirror_melody(user_id: str) -> Dict:

    top_artists = get_top_artists(user_id)

    top_tracks = get_tracks(user_id)

    audio_features = get_audio_features(top_tracks)

    def get_average(key): return sum([t.get(key, 0) for t in audio_features]) / len(audio_features)

    def genre_counts():
        genres = []
        for artist in top_artists:
            genres.extend(artist.get("genres", []))
        return genres

    avg_danceability = get_average("danceability")
    avg_valence = get_average("valence")
    avg_energy = get_average("energy")
    avg_acousticness = get_average("acousticness")
    avg_instrumentalness = get_average("instrumentalness")
    release_years = [int(t["album"]["release_date"][:4]) for t in top_tracks if t.get("album")]
    genre_list = genre_counts()

    traits = [
        {
            "name": "Musical Adventurer",
            "score": min(100, len(set([a["name"] for a in top_artists])) * 5),
            "description": "You love discovering new artists and exploring different genres. Your playlist is a journey through diverse musical landscapes."
        },
        {
            "name": "Emotional Connector",
            "score": int(statistics.stdev([t.get("valence", 0) for t in audio_features]) * 100),
            "description": "You connect deeply with lyrics and melodies that mirror your inner world. Music is your emotional outlet."
        },
        {
            "name": "Trend Awareness",
            "score": sum([1 for a in top_artists if a.get("popularity", 0) > 75]) * 10,
            "description": "You stay in tune with popular hits and cultural moments, always knowing what's hot."
        },
        {
            "name": "Nostalgic Soul",
            "score": sum([1 for y in release_years if y < 2010]) * 10,
            "description": "You love revisiting classic tunes that bring back fond memories. Music is your time machine."
        },
        {
            "name": "Social Listener",
            "score": int(avg_danceability * 100),
            "description": "You often listen to music in social settings or share playlists with friends. Music connects you to others."
        }
    ]

    # Archetypes
    archetypes = []
    genre_str = " ".join(genre_list).lower()
    if any(g in genre_str for g in ["indie pop", "bedroom pop", "folk pop"]):
        archetypes.append({
            "name": "Indie Pop Enthusiast",
            "description": "You gravitate toward artistic, melody-driven music with emotional depth."
        })
    if any(g in genre_str for g in ["alt rock", "grunge", "garage rock"]):
        archetypes.append({
            "name": "Alternative Rock Appreciator",
            "description": "You value authenticity and raw musical expression."
        })
    if any(g in genre_str for g in ["electronic", "edm", "house"]):
        archetypes.append({
            "name": "Electronic Explorer",
            "description": "You're drawn to innovative sounds and production techniques."
        })
    if any(g in genre_str for g in ["pop", "dance pop"]):
        archetypes.append({
            "name": "Pop Connoisseur",
            "description": "You appreciate well-crafted hooks and polished songwriting."
        })

    # Personality Insights (static for now)
    insights = [
        "Your music taste reveals a balanced personality that values both innovation and tradition.",
        "You likely use music as a form of self-expression and emotional regulation.",
        "Your diverse listening habits suggest you're open-minded and culturally curious.",
        "You probably have strong memories associated with specific songs and artists.",
        "Your taste indicates you value artistic integrity alongside mainstream appeal."
    ]

    # Recommendations
    recs = []
    if "folk" not in genre_str:
        recs.append("Explore more artists from the indie-folk genre to expand your emotional connection to music.")
    if all(y > 2015 for y in release_years):
        recs.append("Try creating themed playlists based on different decades to satisfy your nostalgic tendencies.")
    if avg_instrumentalness > 0.5:
        recs.append("Try lo-fi or ambient music for deeper focus and calm moods.")
    if len(archetypes) < 2:
        recs.append("Discover emerging artists in electronic or jazz to feed your adventurous spirit.")
    
    return {
        "musical_personality_traits": traits,
        "music_archetype_matches": archetypes,
        "personality_insights": insights,
        "musical_recommendations": recs
    }


def score_traits(features: list[dict], genres: dict, top_tracks: list = None, top_artists: list = None) -> dict:
    # Handle empty features case
    if not features:
        return {
            "adventurer": 50,
            "emotional": 50,
            "trendy": 50,
            "nostalgic": 50,
            "social": 50,
        }
    
    avg_danceability = sum(f["danceability"] for f in features) / len(features)
    avg_valence = sum(f["valence"] for f in features) / len(features)
    avg_energy = sum(f["energy"] for f in features) / len(features)
    avg_acousticness = sum(f["acousticness"] for f in features) / len(features)

    # Handle empty genres dictionary
    if not genres:
        # Use listening pattern analysis when no genre data is available
        if top_tracks and top_artists:
            pattern_scores = analyze_user_listening_patterns(top_tracks, top_artists)
            # Combine pattern analysis with audio features
            scores = {
                "adventurer": (pattern_scores["adventurer"] + avg_energy * 70) / 2,
                "emotional": (pattern_scores["emotional"] + (1 - avg_valence) * 100) / 2,
                "trendy": (pattern_scores["trendy"] + 60) / 2,
                "nostalgic": (pattern_scores["nostalgic"] + 50) / 2,
                "social": (pattern_scores["social"] + (avg_danceability * 100 if avg_danceability > 0.5 else 40)) / 2,
            }
        else:
            # Fallback to audio features only
            scores = {
                "adventurer": avg_energy * 70,
                "emotional": (1 - avg_valence) * 100,
                "trendy": 60,
                "nostalgic": 50,
                "social": avg_danceability * 100 if avg_danceability > 0.5 else 40,
            }
    else:
        # Convert genre dictionary keys to lowercase for matching
        genre_flags = {g.lower(): count for g, count in genres.items()}

        scores = {
            "adventurer": avg_energy * 100 if "indie" in genre_flags or "experimental" in genre_flags else avg_energy * 70,
            "emotional": (1 - avg_valence) * 100,
            "trendy": 90 if "pop" in genre_flags or "top 40" in genre_flags else 60,
            "nostalgic": 80 if any(g in genre_flags for g in ["80s", "90s", "classic rock"]) else 50,
            "social": avg_danceability * 100 if avg_danceability > 0.5 else 40,
        }

    return scores


def analyze_user_listening_patterns(top_tracks: list, top_artists: list) -> dict:
    """
    Analyze user's listening patterns from top tracks and artists to generate personality scores.
    
    Args:
        top_tracks: List of user's top tracks
        top_artists: List of user's top artists
        
    Returns:
        dict: Personality scores based on listening patterns
    """
    if not top_tracks and not top_artists:
        return {
            "adventurer": 50,
            "emotional": 50,
            "trendy": 50,
            "nostalgic": 50,
            "social": 50,
        }
    
    scores = {
        "adventurer": 50,
        "emotional": 50,
        "trendy": 50,
        "nostalgic": 50,
        "social": 50,
    }
    
    # Analyze artist diversity for adventurer trait
    if top_artists:
        unique_artists = len(set(artist.get("name", "") for artist in top_artists))
        total_artists = len(top_artists)
        diversity_score = (unique_artists / total_artists) * 100 if total_artists > 0 else 50
        
        # Check for indie/alternative artists
        indie_indicators = ["indie", "alternative", "experimental", "underground", "bedroom", "folk", "psychedelic"]
        indie_count = sum(1 for artist in top_artists 
                         if any(indicator in artist.get("name", "").lower() 
                               for indicator in indie_indicators))
        
        # Check for less popular artists (more adventurous)
        less_popular_artists = sum(1 for artist in top_artists 
                                  if artist.get("popularity", 100) < 60)
        
        scores["adventurer"] = min(100, diversity_score + (indie_count * 8) + (less_popular_artists * 3))
    
    # Analyze track characteristics for emotional trait
    if top_tracks:
        # Check for emotional indicators in track names
        emotional_keywords = ["love", "heart", "sad", "lonely", "miss", "cry", "tears", 
                            "feel", "soul", "pain", "hurt", "broken", "dream", "hope",
                            "forever", "always", "never", "away", "home", "memory"]
        emotional_tracks = sum(1 for track in top_tracks 
                             if any(keyword in track.get("song_name", "").lower() 
                                   for keyword in emotional_keywords))
        
        # Check for slower tempo songs (likely more emotional)
        slow_tempo_count = sum(1 for track in top_tracks 
                             if track.get("tempo", 120) < 100)
        
        # Check for acoustic songs (often more emotional)
        acoustic_count = sum(1 for track in top_tracks 
                           if track.get("acousticness", 0) > 0.7)
        
        scores["emotional"] = min(100, 50 + (emotional_tracks * 4) + (slow_tempo_count * 2) + (acoustic_count * 3))
    
    # Analyze popularity for trendy trait
    if top_artists:
        popular_artists = sum(1 for artist in top_artists 
                            if artist.get("popularity", 0) > 70)
        total_artists = len(top_artists)
        popularity_score = (popular_artists / total_artists) * 100 if total_artists > 0 else 50
        scores["trendy"] = min(100, popularity_score + 20)
    
    # Analyze release years for nostalgic trait
    if top_tracks:
        current_year = 2024
        old_tracks = sum(1 for track in top_tracks 
                        if track.get("album", {}).get("release_date", "").startswith("20") and
                        int(track.get("album", {}).get("release_date", "")[:4]) < current_year - 5)
        
        very_old_tracks = sum(1 for track in top_tracks 
                             if track.get("album", {}).get("release_date", "").startswith("19"))
        
        scores["nostalgic"] = min(100, 50 + (old_tracks * 5) + (very_old_tracks * 10))
    
    # Analyze danceability for social trait
    if top_tracks:
        danceable_tracks = sum(1 for track in top_tracks 
                             if track.get("danceability", 0) > 0.6)
        total_tracks = len(top_tracks)
        danceability_score = (danceable_tracks / total_tracks) * 100 if total_tracks > 0 else 50
        scores["social"] = min(100, danceability_score + 20)
    
    return scores


def create_profile(scores: dict, genres: dict) -> tuple[str, list[str], list[str]]:
    dominant_trait = max(scores, key=scores.get)

    profile_map = {
        "adventurer": "The Sonic Explorer",
        "emotional": "The Heartfelt Listener",
        "trendy": "The Modern Hitmaker",
        "nostalgic": "The Retro Curator",
        "social": "The Party Vibe Seeker"
    }

    insight_map = {
        "adventurer": [
            "You crave variety and novelty in music.",
            "You often listen to lesser-known or genre-blending artists.",
        ],
        "emotional": [
            "Music is a mirror for your emotions.",
            "You resonate with deep, meaningful lyrics.",
        ],
        "trendy": [
            "You're in tune with the cultural zeitgeist.",
            "Your taste aligns with what's hot right now.",
        ],
        "nostalgic": [
            "You value music from the past and connect it with memories.",
            "Your playlists are time machines.",
        ],
        "social": [
            "You enjoy communal experiences through music.",
            "You often share music with friends or play it at gatherings.",
        ]
    }

    rec_map = {
        "adventurer": [
            "Explore emerging sub-genres like hyperpop or post-rock.",
            "Let your mood guide your discovery playlists."
        ],
        "emotional": [
            "Listen to singer-songwriters and ambient music.",
            "Use music to unwind or reflect after a long day."
        ],
        "trendy": [
            "Follow trending playlists or viral TikTok sounds.",
            "Stay current with weekly new releases."
        ],
        "nostalgic": [
            "Make throwback playlists from different decades.",
            "Revisit albums you loved as a teen."
        ],
        "social": [
            "Host listening parties or share playlists with friends.",
            "Try collaborative playlist features on Spotify."
        ]
    }

    # Handle empty genres case
    if not genres:
        # Add genre-specific recommendations for when no genre data is available
        if dominant_trait == "adventurer":
            rec_map["adventurer"].append("Try exploring different genres to discover your musical preferences.")
        elif dominant_trait == "emotional":
            rec_map["emotional"].append("Explore various artists to find what resonates with your emotions.")
        elif dominant_trait == "trendy":
            rec_map["trendy"].append("Check out current popular playlists to stay updated with trends.")
        elif dominant_trait == "nostalgic":
            rec_map["nostalgic"].append("Explore music from different decades to find your nostalgic favorites.")
        elif dominant_trait == "social":
            rec_map["social"].append("Try collaborative playlists to enhance your social music experience.")

    return (
        profile_map[dominant_trait],
        insight_map[dominant_trait],
        rec_map[dominant_trait]
    )


def get_genres(top_tracks) -> dict:
    if top_tracks is None or len(top_tracks) == 0:
        return {}

    top_df = pd.DataFrame(top_tracks)
    

    data_copy = data.copy()
    
    # Extract the first artist from the artists list string in the data
    # Handle the string representation of lists like "['Artist1', 'Artist2']"
    def extract_first_artist(artists_str):
        if pd.isna(artists_str) or not isinstance(artists_str, str):
            return None
        try:
            # Remove quotes and brackets, split by comma, and get the first artist
            artists_str = artists_str.strip()
            if artists_str.startswith('[') and artists_str.endswith(']'):
                artists_str = artists_str[1:-1]  # Remove brackets
            # Split by comma and clean up quotes and spaces
            artists = [artist.strip().strip("'\"") for artist in artists_str.split(',')]
            return artists[0] if artists else None
        except:
            return None
    
    # Apply the function to extract first artist
    data_copy['first_artist'] = data_copy['artists'].apply(extract_first_artist)
    
    # Join using the first artist name
    filtered_top_tracks = pd.merge(
        top_df,
        data_copy,
        how="inner",
        left_on=["name", "artists"],
        right_on=["name", "first_artist"]
    )

    # Extract genres and their counts from the predicted_genre column
    if 'predicted_genre' in filtered_top_tracks.columns:
        genre_counts = filtered_top_tracks['predicted_genre'].dropna().value_counts().to_dict()
    else:
        genre_counts = {}
    
    return genre_counts




def generate_music_personality(user_id) -> MusicPersonality:

    top_artists = get_top_artists(user_id)

    top_tracks = get_tracks(user_id)
    
    audio_features = get_audio_features(top_tracks)
    genres = get_genres(top_tracks)

    scores = score_traits(audio_features, genres, top_tracks, top_artists)
    profile, insights, recommendations = create_profile(scores, genres)

    trait_data = [
        {
            "name": "Musical Adventurer",
            "score": int(scores["adventurer"]),
            "description": "You love discovering new artists and exploring different genres.",
            "color": "#FF6B6B"
        },
        {
            "name": "Emotional Connector",
            "score": int(scores["emotional"]),
            "description": "You connect deeply with lyrics and melodies that resonate emotionally.",
            "color": "#4ECDC4"
        },
        {
            "name": "Trend Awareness",
            "score": int(scores["trendy"]),
            "description": "You're attuned to what’s popular but keep your own vibe.",
            "color": "#45B7D1"
        },
        {
            "name": "Nostalgic Soul",
            "score": int(scores["nostalgic"]),
            "description": "You appreciate musical eras gone by.",
            "color": "#96CEB4"
        },
        {
            "name": "Social Listener",
            "score": int(scores["social"]),
            "description": "You enjoy sharing and listening to music in social settings.",
            "color": "#FECA57"
        }
    ]

    return MusicPersonality(
        traits=trait_data,
        overallProfile=profile,
        musicMatches=[
            "Indie Explorer", "Lo-Fi Chill Lover", "Dancefloor Groover"
        ],
        recommendations=recommendations,
        insights=insights
    )


