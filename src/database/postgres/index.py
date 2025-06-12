import os

from psycopg2 import pool
from dotenv import load_dotenv
from psycopg2.extras import execute_values

load_dotenv()
  
PG_POOL = None

def init_db_pools():

    global PG_POOL

    PG_POOL = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=5,
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("POSTGRES_HOST"),
    port=int(os.getenv("POSTGRES_PORT", 5432)),
    database=os.getenv("POSTGRES_DB_NAME")
)

def get_db_conn():
    return PG_POOL.getconn()

def release_db_conn(conn):
    PG_POOL.putconn(conn)

def close_db_pool():
    PG_POOL.closeall()

def close_db_pools():
    if PG_POOL:
        PG_POOL.closeall()




def insert_top_artists(user_id: str, artists: list, conn):
    values = []
    for artist in artists:
        artist_id = artist['id']
        name = artist['name']
        genres = artist['genres']  
        popularity = artist['popularity']
        image = artist['images'][0]['url'] if artist['images'] else None
        external_url = artist['external_urls']['spotify']

        values.append((artist_id, user_id, name, genres, popularity, image, external_url))

    query = """
        INSERT INTO music.artists (artist_id, user_id, name, genres, popularity, image, external_url)
        VALUES %s
        ON CONFLICT (artist_id) DO NOTHING;
    """

    with conn.cursor() as cur:
        execute_values(cur, query, values)
        conn.commit()
