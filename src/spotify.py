import os
import time
import requests
import redis
import psycopg2

from psycopg2.extras import execute_values

from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

TOKEN_URL = 'https://accounts.spotify.com/api/token'

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))


# TODO add user id with the token
REDIS_TOKEN_KEY = "spotify:token" # 
REDIS_EXPIRY_KEY = "spotify:token_expiry"



redis_pool = redis.ConnectionPool(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    max_connections=10  # optional, tune based on usage
)

r = redis.Redis(connection_pool=redis_pool)

def get_client_token_data(client_id: str, client_secret: str):
    return {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }


def get_token_header():
    return {
        "Content-Type": "application/x-www-form-urlencoded"
    }


def fetch_new_token() -> str:
    res = requests.post(
        TOKEN_URL,
        headers=get_token_header(),
        data=get_client_token_data(CLIENT_ID, CLIENT_SECRET)
    )
    if res.status_code == 200:
        data = res.json()
        access_token = data['access_token']
        expires_in = data['expires_in']  #  3600
        r.set(REDIS_TOKEN_KEY, access_token)
        r.set(REDIS_EXPIRY_KEY, int(time.time()) + expires_in - 10)  
        return access_token
    else:
        raise Exception(f"Token request failed: {res.status_code} | {res.text}")


## TODO create a pol for connects
def get_cached_token() -> str:
    token = r.get(REDIS_TOKEN_KEY)
    expiry = r.get(REDIS_EXPIRY_KEY)

    if token and expiry:
        if int(expiry) > int(time.time()):
            return token
        else:
            print("Token expired — fetching a new one")
    else:
        print("No token cached — fetching a new one")

    return fetch_new_token()


def get_spotify_header() -> dict:
    token = get_cached_token()
    return {
        'Authorization': f'Bearer {token}'
    }


def get_top_artists(headers: dict, limit: int = 10, offset: int = 0):

    url = f"https://api.spotify.com/v1/me/top/artists"
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()['items']
    else:
        raise Exception(f"Failed to fetch top artists: {response.status_code} | {response.text}")



def insert_top_artists(user_id: str, artists: list, conn):
    values = []
    for artist in artists:
        artist_id = artist['id']
        name = artist['name']
        genres = artist['genres']  # List of strings
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


# TODO add this to db
token = '0s0qawukwtry081f7klzsvlka'

artists = get_top_artists(token)

conn = psycopg2.connect(
    dbname="music_db",
    user="postgres",
    password="mysecretpassword",
    host="localhost",
    port=5432
)


conn.close()
