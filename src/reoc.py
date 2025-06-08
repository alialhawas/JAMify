
import pandas as pd
import numpy as np

from typing import List, Dict
from collections import defaultdict
from src.utils import number_cols 




def get_song_data(song: Dict, spotify_data: pd.DataFrame):
    try:
        song_data = spotify_data[(spotify_data['name'] == song['name']) & (spotify_data['year'] == song['year'])].iloc[0]
        return song_data
    except IndexError:
        return None

def get_mean_vector(song_list: List[Dict], spotify_data: pd.DataFrame):
    song_vectors = []
    for song in song_list:
        song_data = get_song_data(song, spotify_data)
        if song_data is None:
            continue
        song_vector = song_data[number_cols].values
        song_vectors.append(song_vector)
    if not song_vectors:
        return None
    return np.mean(np.array(song_vectors), axis=0)

def flatten_dict_list(dict_list: List[Dict]):
    flattened_dict = defaultdict(list)
    for dictionary in dict_list:
        for key, value in dictionary.items():
            flattened_dict[key].append(value)
    return flattened_dict


