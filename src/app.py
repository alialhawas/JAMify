import os
import time
import asyncio
from urllib.parse import urlencode
from typing import List, Dict

import pandas as pd
import numpy as np
import httpx

from fastapi import FastAPI, HTTPException, Request, Query
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
)

from src.schemas import SongList, GenSongInput, MirrorInput

from src.song_Gen.murka_test import generate_song, upload_file_to_mureka
from src.song_Gen.youTfileCreateor import download_song_sample

from src.database.postgres.index import (
    get_db_conn,
    release_db_conn,
    close_db_pools,
    insert_top_artists,
    init_db_pools,
    insert_top_tracks,
)

from src.database.redis.index import get_redis


CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = "user-top-read"

app = FastAPI()

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

    # recs = recs[recs['predicted_genre'].isin(input_genres)]
    print (recs.columns)

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

@app.post("/genSong")
def gen_song(input_data: GenSongInput):
    try:
        if input_data.youTube_link:
            download_song_sample(youtube_url=input_data.youTube_link)
            ref_id = upload_file_to_mureka()
            result = generate_song(lyricsPrompt=input_data.lyric_prompt,
                prompt=input_data.song_prompt,
                reference_id=ref_id
            )
        else:
            result = generate_song(
                lyricsPrompt=input_data.lyric_prompt,
                prompt=input_data.song_prompt
            )
        return {"status": "success", "generated_song": result}
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

    redis_con = get_redis()  # replace with async Redis if using aioredis etc.
    redis_con.set(f"spotify:{user_id}:access_token", access_token)
    redis_con.set(f"spotify:{user_id}:refresh_token", refresh_token)
    redis_con.set(f"spotify:{user_id}:expires_at", str(int(time.time()) + expires_in - 10))

    await asyncio.gather(
        user_artiest(user_id, 'short_term'),
        user_artiest(user_id, 'medium_term'),
        user_artiest(user_id, 'long_term'),
        asyncio.to_thread(user_tracks, user_id, 'short_term'),
        asyncio.to_thread(user_tracks, user_id, 'medium_term'),
        asyncio.to_thread(user_tracks, user_id, 'long_term'),
    )
    return JSONResponse(content={"message": "Login successful", "user_id": user_id})


@app.get("/top-artists")
def get_top_artists(
    user_id: str = Query(..., 
        min_length=5,
        description="User ID must be at least 5 characters long and not just whitespace"
    ),
    period: str = Query(..., pattern="^(short_term|medium_term|long_term)$")
):
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
            content={"error": f"Fetching from DB failed: {str(e)}"}
        )
    
    finally:
        cursor.close()
        release_db_conn(conn)
    
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]

    return JSONResponse(content={"top-artiest": result})



@app.get("/top-tracks")
def get_top_tracks(

    user_id: str = Query(..., 
        min_length=5,
        description="User ID must be at least 5 characters long and not just whitespace"
    ),
    period: str = Query(..., pattern="^(short_term|medium_term|long_term)$")

):

    if not user_id.strip():
        raise HTTPException(status_code=400, detail="User ID must not be empty or just whitespace")

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
            content={"error": f"Fetching from DB failed: {str(e)}"}
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

@app.on_event("shutdown")
def shutdown():
    close_db_pools


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)