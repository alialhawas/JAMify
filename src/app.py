import os
import pandas as pd
import numpy as np
import requests
import redis
import time 

from annoy import AnnoyIndex
from fastapi import FastAPI, HTTPException, FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from urllib.parse import urlencode

from typing import List, Dict
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics.pairwise import cosine_similarity

from src.reoc import flatten_dict_list, get_mean_vector
from src.utils import number_cols, SongList, GenSongInput
from src.song_Gen.murka_test import generate_song, upload_file_to_mureka
from src.song_Gen.youTfileCreateor import download_songs_sample



CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = "user-top-read"

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

app = FastAPI()

annoy_index = None
index_map = {}  # maps Annoy index ID to original DataFrame index

# TODO move this def to utils (handle circular imports)
# def recommend_songs(song_list: List[Dict], spotify_data: pd.DataFrame, n_songs=10):
#     metadata_cols = ['name', 'year', 'artists']
#     song_dict = flatten_dict_list(song_list) # -> {'name': ['Blinding Lights', 'Bad Guy', 'Shape of You'], 'year': [2019, 2019, 2017]}
#     song_center = get_mean_vector(song_list, spotify_data)

#     if song_center is None:
#         raise ValueError("None of the input songs were found in the database.")

#     scaler = song_cluster_pipeline.named_steps['scaler']
#     query_vector = scaler.transform(song_center.reshape(1, -1))[0]

#     idxs = annoy_index.get_nns_by_vector(query_vector, n_songs + len(song_list))
#     recs = spotify_data.iloc[idxs]


#     recs = recs[~recs['name'].isin(song_dict['name'])]

#     return recs[metadata_cols].head(n_songs).to_dict(orient='records')


def recommend_songs(song_list: List[Dict], spotify_data: pd.DataFrame, n_songs=10):
    metadata_cols = ['name', 'year', 'artists', 'predicted_genre']

    song_dict = flatten_dict_list(song_list) # => {'name': ['Blinding Lights', 'Bad Guy', 'Shape of You'], 'year': [2019, 2019, 2017]}
    song_center = get_mean_vector(song_list, spotify_data)

    if song_center is None:
        raise ValueError("None of the input songs were found in the database.")

    input_songs_df = pd.DataFrame(song_list)

    merged = input_songs_df.merge(
        spotify_data[['name', 'year', 'predicted_genre']],
        on=['name', 'year'],
        how='left'
    )
    input_genres = merged['predicted_genre'].dropna().unique()### add  if teh songs is not in the init data pull it form sploify api 

    if len(input_genres) == 0:
        raise ValueError("Could not find genres for input songs.")

    scaler = song_cluster_pipeline.named_steps['scaler']
    query_vector = scaler.transform(song_center.reshape(1, -1))[0]

    idxs = annoy_index.get_nns_by_vector(query_vector, n_songs + len(song_list) * 10)  # extra candidates
    recs = spotify_data.iloc[idxs]

    # Exclude input songs
    recs = recs[~recs['name'].isin(song_dict['name'])]

    # Filter recommendations by genre — only songs whose predicted_genre is in input genres
    recs = recs[recs['predicted_genre'].isin(input_genres)]

    return recs[metadata_cols].head(n_songs).to_dict(orient='records')



@app.on_event("startup")
def startup_event():
    """
    here we do two things here two predictdict the genre of the songs and we create the annoy index for the songs simmlitifys
    """

    global data, song_cluster_pipeline, annoy_index, index_map

    data = pd.read_csv("data/data.csv")
    data["first_artist"] = data["artists"].apply(lambda x: eval(x)[0] if isinstance(x, str) else x)

    genre_df = pd.read_csv("data/data_by_genres.csv")

    features = [
        'acousticness', 'danceability', 'duration_ms', 'energy',
        'instrumentalness', 'liveness', 'loudness', 'speechiness',
        'tempo', 'valence', 'popularity', 'key', 'mode'
    ]

    scaler_genre = StandardScaler()
    scaled_song_features = scaler_genre.fit_transform(data[features])
    scaled_genre_features = scaler_genre.transform(genre_df[features])

    similarity_matrix = cosine_similarity(scaled_song_features, scaled_genre_features)
    closest_genre_indices = np.argmax(similarity_matrix, axis=1)
    data['predicted_genre'] = genre_df.iloc[closest_genre_indices]['genres'].values

    # --- Clustering & Annoy index ---
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

    # global data, song_cluster_pipeline, annoy_index, index_map

    # data = pd.read_csv("data/data.csv")
    # data["first_artist"] = data["artists"].apply(lambda x: eval(x)[0] if isinstance(x, str) else x)

    # song_cluster_pipeline = Pipeline([
    #     ('scaler', StandardScaler()),
    #     ('kmeans', KMeans(n_clusters=20, verbose=False))
    # ])
    # X = data[number_cols]
    # song_cluster_pipeline.fit(X)
    # data['cluster_label'] = song_cluster_pipeline.predict(X)

    # # 🧠 Build Annoy index
    # scaler = song_cluster_pipeline.named_steps['scaler']
    # X_scaled = scaler.transform(X)
    # dim = X_scaled.shape[1]
    # annoy_index = AnnoyIndex(dim, 'euclidean')

    # for i, vector in enumerate(X_scaled):
    #     annoy_index.add_item(i, vector)
    #     index_map[i] = i

    # annoy_index.build(n_trees=10)
    # print("✅ Annoy index built.")


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
            download_songs_sample(youtube_url=input_data.youTube_link)
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


@app.get("/health")
def health_check():
    if data is not None and annoy_index is not None:
        return {"status": "ok"}
    return {"status": "unhealthy"}, 500


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
def callback(request: Request, code: str):
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }

    res = requests.post(token_url, data=payload)
    if res.status_code != 200:
        return JSONResponse(status_code=400, content={"error": "Token exchange failed"})

    token_info = res.json()
    access_token = token_info["access_token"]
    refresh_token = token_info.get("refresh_token")
    expires_in = token_info["expires_in"]

    user_res = requests.get("https://api.spotify.com/v1/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    user_info = user_res.json()
    user_id = user_info["id"]

    r.set(f"spotify:{user_id}:access_token", access_token)
    r.set(f"spotify:{user_id}:refresh_token", refresh_token)
    r.set(f"spotify:{user_id}:expires_at", str(int(time.time()) + expires_in - 10))

    return JSONResponse(content={"message": "Login successful", "user_id": user_id})


@app.get("/top-artists")
def get_top_artists(user_id: str):
    access_token = r.get(f"spotify:{user_id}:access_token")
    if not access_token:
        return JSONResponse(status_code=401, content={"error": "User not authenticated"})

    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get("https://api.spotify.com/v1/me/top/artists", headers=headers)

    if res.status_code == 401:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})

    return res.json()
