
import redis
import os

REDIS_POOL = None
redis_client = None


def init_redis_pool():
        global REDIS_POOL, redis_client

        if REDIS_POOL is None:
            REDIS_POOL = redis.ConnectionPool(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            decode_responses=True
        )
        redis_client = redis.Redis(connection_pool=REDIS_POOL)

def get_redis():
    return redis_client

