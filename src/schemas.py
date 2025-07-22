
from pydantic import BaseModel
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

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

class AudioFeatures(BaseModel):
    danceability: float
    energy: float
    valence: float
    acousticness: float
    instrumentalness: float
    tempo: float
    speechiness: float
    liveness: float

# remove this and stiore user data in redis for 5 for all end points and only user id  to idenify user 
class MirrorInput(BaseModel):
    tracks: List[AudioFeatures]


class TopTracks(BaseModel):
    userid: str = Field(..., min_length=3, description="User ID must be at least 3 characters long")
    time_range: str = Field(..., description="Time range must be one of: short_term, medium_term, long_term")

    @field_validator("userid")
    def validate_userid(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 5:
            raise ValueError("User ID cannot be empty or just whitespace and must be more than 5 char")
        return v

    @field_validator("time_range")
    def validate_time_range(cls, v: str) -> str:
        allowed_ranges = {"short_term", "medium_term", "long_term"}
        if v not in allowed_ranges:
            raise ValueError(f"time_range must be one of {allowed_ranges}")
        return v
