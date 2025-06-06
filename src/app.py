
import pandas as pd

from annoy import AnnoyIndex
from fastapi import FastAPI, HTTPException

from typing import List, Dict
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from src.reoc import flatten_dict_list, get_mean_vector

from src.utils import number_cols, SongList, GenSongInput

from src.song_Gen.murka_test import generate_song, upload_file_to_mureka
from src.song_Gen.youTfileCreateor import download_songs_sample


app = FastAPI()


annoy_index = None
index_map = {}  # maps Annoy index ID to original DataFrame index

# TODO move this def to utils (handle circular imports)
def recommend_songs(song_list: List[Dict], spotify_data: pd.DataFrame, n_songs=10):
    metadata_cols = ['name', 'year', 'artists']
    song_dict = flatten_dict_list(song_list) # -> {'name': ['Blinding Lights', 'Bad Guy', 'Shape of You'], 'year': [2019, 2019, 2017]}
    song_center = get_mean_vector(song_list, spotify_data) 

    if song_center is None:
        raise ValueError("None of the input songs were found in the database.")

    scaler = song_cluster_pipeline.named_steps['scaler']
    query_vector = scaler.transform(song_center.reshape(1, -1))[0]

    idxs = annoy_index.get_nns_by_vector(query_vector, n_songs + len(song_list))
    recs = spotify_data.iloc[idxs]


    recs = recs[~recs['name'].isin(song_dict['name'])]

    return recs[metadata_cols].head(n_songs).to_dict(orient='records')



@app.on_event("startup")
def startup_event():
    global data, song_cluster_pipeline, annoy_index, index_map

    data = pd.read_csv("data/data.csv")
    data["first_artist"] = data["artists"].apply(lambda x: eval(x)[0] if isinstance(x, str) else x)

    song_cluster_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('kmeans', KMeans(n_clusters=20, verbose=False))
    ])
    X = data[number_cols]
    song_cluster_pipeline.fit(X)
    data['cluster_label'] = song_cluster_pipeline.predict(X)

    # 🧠 Build Annoy index
    scaler = song_cluster_pipeline.named_steps['scaler']
    X_scaled = scaler.transform(X)
    dim = X_scaled.shape[1]
    annoy_index = AnnoyIndex(dim, 'euclidean')

    for i, vector in enumerate(X_scaled):
        annoy_index.add_item(i, vector)
        index_map[i] = i

    annoy_index.build(n_trees=10)
    print("✅ Annoy index built.")


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


