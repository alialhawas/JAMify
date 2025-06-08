import os
import time
import requests
import redis

from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

TOKEN_URL = 'https://accounts.spotify.com/api/token'

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

REDIS_TOKEN_KEY = "spotify:token"
REDIS_EXPIRY_KEY = "spotify:token_expiry"

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def get_token_data(client_id: str, client_secret: str):
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
        data=get_token_data(CLIENT_ID, CLIENT_SECRET)
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


