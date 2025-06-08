

import pandas as pd

from typing import List, Optional

from sklearn.pipeline import Pipeline
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from pydantic import BaseModel 
from annoy import AnnoyIndex


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


class SongInput(BaseModel):
    name: str
    year: int

class SongList(BaseModel):
    songs: List[SongInput]
    n_songs: int = 10

class GenSongInput(BaseModel):
    lyric_prompt: str  
    song_prompt: Optional[str] = None  
    youTube_link: Optional[str] = None  
