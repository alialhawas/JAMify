import os
from datetime import datetime

# TODO use asyncpg for sclabltiy 
from psycopg2 import pool
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from src.database.redis.index import init_redis_pool

load_dotenv()
  
PG_POOL = None

def init_db_pools():

    global PG_POOL

    PG_POOL = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=7,
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("POSTGRES_HOST"),
    port=int(os.getenv("POSTGRES_PORT", 5432)),
    database=os.getenv("POSTGRES_DB_NAME")
    )

    init_redis_pool()


def get_db_conn():
    return PG_POOL.getconn()

def release_db_conn(conn):
    PG_POOL.putconn(conn)

def close_db_pool():
    PG_POOL.closeall()

def close_db_pools():
    if PG_POOL:
        PG_POOL.closeall()


def insert_top_artists(user_id: str, artists: list, time_range: str, conn):
    values = []
    for rank, artist in enumerate(artists, start=1):  
        artist_id = artist['id']
        name = artist['name']
        genres = artist['genres']  
        popularity = artist['popularity']
        image = artist['images'][0]['url'] if artist['images'] else None
        external_url = artist['external_urls']['spotify']

        values.append((artist_id, user_id, name, genres, popularity, image, external_url, time_range, rank))

    query = """
        INSERT INTO music.artists (artist_id, user_id, name, genres, popularity, image, external_url, time_range, rank)
        VALUES %s
        ON CONFLICT (artist_id, user_id ,time_range) DO NOTHING;
    """

    with conn.cursor() as cur:
        execute_values(cur, query, values)
        conn.commit()


def parse_release_date(date_str):
    """Converts Spotify date string to 'YYYY-MM-DD' format."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m").date()
        except ValueError:
            try:
                return datetime.strptime(date_str, "%Y").date()
            except ValueError:
                return None



def insert_top_tracks(user_id: str, tracks: list, time_range: str,  conn):
    values = []
    for rank, track in enumerate(tracks, start=1):  
        song_id = track['id']
        song_name = track['name']
        release_date_raw = track['album'].get('release_date')
        release_date = parse_release_date(release_date_raw)

        popularity = track.get('popularity')
        preview_url = track.get('preview_url')
        external_url = track['external_urls'].get('spotify')

        first_artist = track['artists'][0]
        artist_id = first_artist['id']
        artist_name = first_artist['name']

        images = track['album'].get('images', [])
        image1 = images[0]['url'] if len(images) > 0 else None
        image2 = images[1]['url'] if len(images) > 1 else None
        image3 = images[2]['url'] if len(images) > 2 else None

        values.append((
            song_id,
            user_id,
            song_name,
            artist_id,
            artist_name,
            release_date,
            image1,
            image2,
            image3,
            external_url,
            popularity,
            preview_url,
            rank,
            time_range
        ))

    query = """
        INSERT INTO music.songs (
            song_id, user_id, song_name, artist_id, artist_name,
            release_date, image1, image2, image3,
            external_url, popularity, preview_url, rank, time_range
        )
        VALUES %s
        ON CONFLICT (song_id, user_id, time_range) DO NOTHING;
    """

    with conn.cursor() as cur:
        from psycopg2.extras import execute_values
        execute_values(cur, query, values)
        conn.commit()


