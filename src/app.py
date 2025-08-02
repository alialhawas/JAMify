import os
import time
import asyncio
from urllib.parse import urlencode
from typing import List, Dict
import requests

from fastapi import Request, Query
from fastapi.responses import JSONResponse
from typing import Dict

import pandas as pd
import numpy as np
import httpx
import jwt

from fastapi import FastAPI, HTTPException, Request, Query,status
from fastapi.responses import RedirectResponse, JSONResponse

from annoy import AnnoyIndex
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics.pairwise import cosine_similarity

from src.rec import flatten_dict_list, get_mean_vector
from src.utils import (
    number_cols,
    generate_music_personality,
    map_mood,
    describe_sonic_palette,
    compute_music_dna,
    detect_evolution,
    user_tracks,
    user_artiest,
    create_jwt,
    get_current_user,
    user_key_func,
    get_user_id_from_jwt
)


from src.schemas import SongList, GenSongInput, MirrorInput, MusicPersonality

from src.song_Gen.murka import generate_song, upload_file_to_mureka
from src.song_Gen.youTfileCreateor import download_song_sample

from src.database.postgres.index import (
    get_db_conn,
    release_db_conn,
    close_db_pools,
    init_db_pools,
)

from src.database.redis.index import get_redis

from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = "user-top-read"

ENV = os.getenv('ENV')

JWT_SECRET =  os.getenv("JWT_SECRET") 
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

app = FastAPI()


@app.middleware("http")
async def inject_user(request: Request, call_next):
    try:
        request.state.user_id = get_current_user(request)
    except:
        request.state.user_id = get_remote_address(request)
    return await call_next(request)

limiter = Limiter(key_func=user_key_func)


app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Rate limit exceeded"}
))

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_methods = os.getenv("ALLOWED_METHODS", "").split(",")
allowed_headers = os.getenv("ALLOWED_HEADERS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],  
    allow_credentials=True,  #  to allow cookies
    allow_methods=[method.strip() for method in allowed_methods], 
    allow_headers=[header.strip() for header in allowed_headers], 
)

annoy_index = None
index_map = {}  # maps Annoy index ID to original DataFrame index

features = [
'acousticness', 'danceability', 'duration_ms', 'energy',
'instrumentalness', 'liveness', 'loudness', 'speechiness',
'tempo', 'valence', 'popularity', 'key', 'mode'
]

# TODO move this def to utils (handle circular imports)
def recommend_songs(song_list: List[Dict], spotify_data: pd.DataFrame, n_songs=10):
    metadata_cols = ['name', 'year', 'artists', 'predicted_genre']

    song_dict = flatten_dict_list(song_list) # => {'name': ['Blinding Lights', 'Bad Guy', 'Shape of You'], 'year': [2019, 2019, 2017]}
    song_center = get_mean_vector(song_list, spotify_data)

    if song_center is None:
        raise ValueError("None of the input songs were found in the database.")

    input_songs_df = pd.DataFrame(song_list)

    # TODO move this to the on start up for better peformnce
    merged = input_songs_df.merge(
        spotify_data[['name', 'year', 'predicted_genre']],
        on=['name', 'year'],
        how='left'
    )

    input_genres = merged['predicted_genre'].dropna().unique() # add if the songs is not in the init data pull it form sploify api 

    if len(input_genres) == 0:
        raise ValueError("Could not find genres for input songs.")

    scaler = song_cluster_pipeline.named_steps['scaler']
    query_vector = scaler.transform(song_center.reshape(1, -1))[0]

    idxs = annoy_index.get_nns_by_vector(query_vector, n_songs + len(song_list) * 10)  # extra candidates
    recs = spotify_data.iloc[idxs]

    recs = recs[~recs['name'].isin(song_dict['name'])]

    return recs[metadata_cols + features].head(n_songs).to_dict(orient='records')


@app.on_event("startup")
def startup_event():
    """
    here we do two things here two predictdict the genre of the songs and we create the annoy index for the songs simmlitifys
    """

    global data, song_cluster_pipeline, annoy_index, index_map  

    init_db_pools()


    # TODO read this from db and every time you pull a song you add it the data 

    data = pd.read_csv("data/data.csv")

    data["first_artist"] = data["artists"].apply(lambda x: eval(x)[0] if isinstance(x, str) else x)

    genre_df = pd.read_csv("data/data_by_genres.csv")

    scaler_genre = StandardScaler()
    scaled_song_features = scaler_genre.fit_transform(data[features])
    scaled_genre_features = scaler_genre.transform(genre_df[features])

    similarity_matrix = cosine_similarity(scaled_song_features, scaled_genre_features)
    closest_genre_indices = np.argmax(similarity_matrix, axis=1)
    data['predicted_genre'] = genre_df.iloc[closest_genre_indices]['genres'].values

    song_cluster_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('kmeans', KMeans(n_clusters=20, verbose=False))
    ])
    X = data[number_cols]
    song_cluster_pipeline.fit(X)
    data['cluster_label'] = song_cluster_pipeline.predict(X)

    scaler = song_cluster_pipeline.named_steps['scaler']
    X_scaled = scaler.transform(X)
    dim = X_scaled.shape[1]
    annoy_index = AnnoyIndex(dim, 'euclidean')

    for i, vector in enumerate(X_scaled):
        annoy_index.add_item(i, vector)
        index_map[i] = i

    # TODO add annoy_index to the reconmandions api (annoy_index.get_nns_by_vector(query_vector, 10))
    annoy_index.build(n_trees=10)

    print("✅ Annoy index built and genres assigned.")

@app.get("/health")
def health_check():
    if data is not None and annoy_index is not None:
        return {"status": "ok"}
    return {"status": "unhealthy"}, 500


@app.post("/recommend")
def recommend(song_input: SongList):
    try:
        input_songs = [song.dict() for song in song_input.songs]
        recommendations = recommend_songs(input_songs, data, song_input.n_songs)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/recommendHypird")
def recommend(song_input: SongList):
    try:
        input_songs = [song.dict() for song in song_input.songs]
        recommendations = recommend_songs(input_songs, data, song_input.n_songs)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/genSong")
@limiter.limit("5/hour")
def gen_song(request: Request, input_data: GenSongInput):
    try:
        if input_data.youTube_link:
            download_song_sample(youtube_url=input_data.youTube_link)
            ref_id = upload_file_to_mureka()
            full_lyrics,audio_data = generate_song(lyricsPrompt=input_data.lyric_prompt,
                prompt=input_data.song_prompt,
                reference_id=ref_id
            )
        else:

            full_lyrics,audio_data = generate_song(
                lyricsPrompt=input_data.lyric_prompt,
                prompt=input_data.song_prompt
            )
        return {"status": "success", "full_lyrics": full_lyrics, "audio_data": audio_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/login")
def login():
    query_params = urlencode({
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "show_dialog": "true"
    })
    return RedirectResponse(url=f"https://accounts.spotify.com/authorize?{query_params}")


@app.get("/callback")
async def callback(request: Request, code: str):
    token_url = "https://accounts.spotify.com/api/token"

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(token_url, data=payload)

        if res.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "Token exchange failed"})

        token_info = res.json()
        access_token = token_info["access_token"]
        refresh_token = token_info.get("refresh_token")
        expires_in = token_info["expires_in"]

        user_res = await client.get("https://api.spotify.com/v1/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        user_info = user_res.json()
        user_id = user_info["id"]

    redis_con = get_redis()  # TODO use aioredis later


    expires_at = int(time.time()) + expires_in - 10
    
    redis_con.hset(f"spotify:{user_id}:tokens", mapping={
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": expires_at
    })

    redis_con.expire(f"spotify:{user_id}:tokens", expires_in)


    """ To make it as backgroup task (fire and forget) createed new procesing for
      each one havey on cpu but increate peformnace"""
    
    asyncio.create_task(user_artiest(user_id, 'short_term'))
    asyncio.create_task(user_artiest(user_id, 'medium_term'))
    asyncio.create_task(user_artiest(user_id, 'long_term'))

    asyncio.create_task(asyncio.to_thread(user_tracks, user_id, 'short_term'))
    asyncio.create_task(asyncio.to_thread(user_tracks, user_id, 'medium_term'))
    asyncio.create_task(asyncio.to_thread(user_tracks, user_id, 'long_term'))

    jwt_token = create_jwt(user_id=user_id)
    
    callback_url = os.getenv("CALLBACK_URL")
    response = RedirectResponse(url=callback_url)
    
    response.set_cookie(
        key="jwt",
        value=jwt_token,
        httponly=True,
        secure=False,  # ✅ Set to False **only** for local dev; True in prod with HTTPS
        samesite="Lax",  # or "None" if frontend is hosted on a different domain
        max_age=3600 * 2,
        path="/"
    )    

    return response


@app.get("/top-artists")
def get_top_artists(
    request: Request,
    period: str = Query(..., pattern="^(short_term|medium_term|long_term)$")
):
    
    token = request.cookies.get("jwt")

    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user_id = get_user_id_from_jwt(token)

    query = """
        SELECT name, popularity, image, time_range, rank
        FROM music.artists
        WHERE user_id = %s AND time_range = %s;
    """

    if not user_id.strip():
        raise HTTPException(status_code=400, detail="User ID must not be empty or just whitespace")


    try:
        conn = get_db_conn()
        cursor = conn.cursor()
        cursor.execute(query, (user_id, period))
        rows = cursor.fetchall()

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Fetching user data from DB failed: {str(e)}"}
        )
    
    finally:
        cursor.close()
        release_db_conn(conn)
    
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]

    return JSONResponse(content={"top-artiest": result})


@app.get("/top-tracks")
async def get_top_tracks(
    request: Request,
    period: str = Query(..., pattern="^(short_term|medium_term|long_term)$")
):
    
    token = request.cookies.get("jwt")

    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user_id = get_user_id_from_jwt(token) 
    query = """
        SELECT song_name, artist_name, image1 , image2 , image3, popularity, "rank", time_range
        FROM music.songs
        WHERE user_id = %s AND time_range = %s;
    """

    try:
        conn = get_db_conn()
        cursor = conn.cursor()
        cursor.execute(query, (user_id, period))
        rows = cursor.fetchall()

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Fetching user data from DB failed: {str(e)}"}
        )
    
    finally:
        cursor.close()
        release_db_conn(conn)
    
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]

    return JSONResponse(content={"top-tracks": result})


@app.get("/top-songs-year")
def get_top_songs(year: int):
    return data[data['year'] == year].sort_values('popularity', ascending=False).head(10).to_dict(orient='records')


@app.post("/mirror/personality")
def analyze_mirror_melody(input_data: MirrorInput):
    features = input_data.tracks
    avg = {
        key: sum(getattr(track, key) for track in features) / len(features)
        for key in features[0].__fields__.keys()
    }
    personality = generate_music_personality(avg)
    
    return {
        "personality": personality,
        "average_features": avg
    }


@app.post("/mirror/personality")
def analyze_personality(input_data: MirrorInput):
    features = input_data.tracks
    avg = {
        key: sum(getattr(t, key) for t in features) / len(features)
        for key in features[0].__fields__.keys()
    }
    return {
        "personality": generate_music_personality(avg),
        "average_features": avg
    }

@app.post("/mirror/mood")
def analyze_mood(input_data: MirrorInput):
    features = input_data.tracks
    avg_valence = sum(t.valence for t in features) / len(features)
    avg_energy = sum(t.energy for t in features) / len(features)
    return {
        "mood": map_mood(avg_valence, avg_energy),
        "valence": avg_valence,
        "energy": avg_energy
    }

@app.post("/mirror/audio-mirror")
def audio_mirror(input_data: MirrorInput):
    features = input_data.tracks
    avg = {
        key: sum(getattr(t, key) for t in features) / len(features)
        for key in features[0].__fields__.keys()
    }
    return {
        "sonic_palette": describe_sonic_palette(avg),
        "average_features": avg
    }

@app.post("/mirror/dna")
def music_dna(input_data: MirrorInput):
    return compute_music_dna(input_data.tracks)

@app.post("/mirror/evolution")
def listening_evolution(input_data: MirrorInput):
    return detect_evolution(input_data.tracks)


@app.get("/verify-jwt")
async def verify_jwt(request: Request):
    token = request.cookies.get("jwt")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
        return {"user_id": user_id, "status": "ok"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


@app.get("/top-genres")
def get_top_genres_mock(
    request: Request,
    period: str = Query(..., pattern="^(short_term|medium_term|long_term)$")
):
    mock_data = {
        "short_term": {
            "pop": 20,
            "rock": 10,
            "hip-hop": 5,
            "indie": 3,
        },
        "medium_term": {
            "pop": 35,
            "rock": 20,
            "hip-hop": 10,
            "indie": 6,
            "electronic": 4,
        },
        "long_term": {
            "pop": 42,
            "rock": 25,
            "hip-hop": 18,
            "indie": 10,
            "electronic": 7,
            "jazz": 5,
        },
    }

    genre_counts = mock_data.get(period, {})

    total = sum(genre_counts.values())

    if total == 0:
        return JSONResponse({"message": "No genre data available"}, status_code=404)

    genre_percentages = {
        genre: round((count / total) * 100, 2)
        for genre, count in genre_counts.items()
    }

    sorted_genres = sorted(genre_percentages.items(), key=lambda x: x[1], reverse=True)

    top_genre, top_pct = sorted_genres[0]
    summary = f"Your top genre is {top_genre.title()} at {int(top_pct)}%, showing your main music taste."

    if len(sorted_genres) > 1:
        others = sorted_genres[1:3]  # Next top 2
        other_summary = " and ".join([f"{g.title()} ({int(p)}%)" for g, p in others])
        summary += f" The strong presence of {other_summary} adds variety to your preferences."

    return {
        "genre_percentages": genre_percentages,
        "summary": summary,
        "top_genres": sorted_genres[:5],
    }


@app.get("/profile")
def get_spotify_profile(request: Request):
    token = request.cookies.get("jwt")

    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user_id = get_user_id_from_jwt(token) 

    redis_con = get_redis()

    token_data = redis_con.hgetall(f"spotify:{user_id}:tokens")

    if not token_data:
        raise HTTPException(status_code=401, detail="Spotify token not found in Redis")

    access_token = token_data['access_token']

    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    resp = requests.get("https://api.spotify.com/v1/me", headers=headers)
    data = resp.json()

    images = data.get("images", [])
    has_avatar = len(images) > 0
    avatar_url = images[0]["url"] if has_avatar else ""

    return {
        "display_name": data.get("display_name"),
        "avatar_url": avatar_url,
        "has_avatar": has_avatar
    }



@app.get("/mirror-melody/personality", response_model=MusicPersonality)
def get_music_personality(request: Request):
    token = request.cookies.get("jwt")

    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user_id = get_user_id_from_jwt(token)
     
    return generate_music_personality(user_id)


# def get_spotify_profile(request: Request):
#     token = request.cookies.get("jwt")

#     if not token:
#         raise HTTPException(status_code=401, detail="No token provided")

#     user_id = get_user_id_from_jwt(token) 
#     return generate_music_personality(user_id)


def analyze_music_personality(top_tracks, top_artists, top_genres, features) -> MusicPersonality:
    avg_danceability = sum([t["danceability"] for t in features]) / len(features)
    avg_valence = sum([t["valence"] for t in features]) / len(features)
    genre_names = [g.lower() for g in top_genres]

    traits = []

    if "indie" in genre_names or avg_valence > 0.6:
        traits.append({
            "name": "Musical Adventurer",
            "score": int(avg_valence * 100),
            "description": "You love discovering new artists and exploring different genres.",
            "color": "#FF6B6B"
        })

    if avg_valence < 0.5:
        traits.append({
            "name": "Emotional Connector",
            "score": int((1 - avg_valence) * 100),
            "description": "You connect deeply with emotional music.",
            "color": "#4ECDC4"
        })

    if "pop" in genre_names:
        traits.append({
            "name": "Trend Awareness",
            "score": 78,
            "description": "You stay current with popular music.",
            "color": "#45B7D1"
        })

    if any(g in genre_names for g in ["classic rock", "retro", "80s", "90s"]):
        traits.append({
            "name": "Nostalgic Soul",
            "score": 70,
            "description": "You love timeless classics.",
            "color": "#96CEB4"
        })

    traits.append({
        "name": "Social Listener",
        "score": 65,
        "description": "You enjoy sharing music and listening in social settings.",
        "color": "#FECA57"
    })

    return MusicPersonality(
        traits=traits,
        overallProfile="The Eclectic Curator",
        musicMatches=[
            "Indie Pop Enthusiast", "Electronic Explorer", "Pop Connoisseur"
        ],
        recommendations=[
            "Create themed playlists by decade",
            "Explore more indie-folk artists",
            "Try ambient or jazz for focus",
            "Join music forums or Discords"
        ],
        insights=[
            "You're open-minded and musically curious",
            "Music is both a comfort and inspiration for you",
            "You balance deep emotional resonance with sonic exploration"
        ]
    )



@app.on_event("shutdown")
def shutdown():
    close_db_pools


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)