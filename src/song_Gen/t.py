import redis
import base64

def get_redis_connection(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=False  # set to True if you want strings instead of bytes
):
    try:
        r = redis.Redis(
            host=host,
            port=port,
            db=db,
            decode_responses=decode_responses
        )
        r.ping()
        print("✅ Redis connected successfully.")
        return r
    except redis.ConnectionError as e:
        print(f"❌ Redis connection failed: {e}")
        return None


r = get_redis_connection()



# # Key you want to read
# key = "unhealthy_(feat._shania_twain):anne-marie"

# # Fetch the value
# value = r.get(key)

# if value:
#     # Decode base64 to raw MP3 bytes
#     mp3_bytes = base64.b64decode(value)

#     # Save to file
#     with open("sample_output.mp3", "wb") as f:
#         f.write(mp3_bytes)

#     print("✅ MP3 file saved as sample_output.mp3")
# else:
#     print("⚠️ No value found for key.")


# List all keys
keys = r.keys("*")
print(f"🔑 Found {len(keys)} keys")

# Print keys and preview values
for key in keys:
    value = r.get(key)
    print(f"Key: {key.decode()}")
    if value:
        print(f"Value preview: {value[:100]}...\n")


r.flushdb()
r.flushall()


