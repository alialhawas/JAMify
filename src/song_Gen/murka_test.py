
import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("MUREKA_API_KEY")
if not api_key:
    raise ValueError("MUREKA API key is missing")


headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
    }


def generate_lyrics(prompt):
    """
    Sends a request to the Mureka API to generate lyrics based on a prompt.

    Args:
        prompt (str): The text prompt to generate lyrics from.

    Returns:
        str: The generated lyrics, or an error message.
    """

    url = "https://api.mureka.ai/v1/lyrics/generate"


    data = {
        "prompt": prompt
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        return response.json().get("lyrics", "No lyrics returned.")
    else:
        return f"Error {response.status_code}: {response.text}"


# TODO handel the aduio files in a better way 
def upload_file_to_mureka(file_path='./best_30s.mp3', purpose="reference"):
    url = "https://api.mureka.ai/v1/files/upload"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    files = {
        "file": open(file_path, "rb")
    }
    data = {
        "purpose": purpose
    }

    response = requests.post(url, headers=headers, files=files, data=data)

    files["file"].close()

    if response.status_code == 200:
        return response.json()['id']
    else:
        raise Exception(f"Upload failed: {response.status_code}, {response.text}")


def generate_song(lyricsPrompt, model="auto", prompt=None, reference_id=None, poll_interval=2, timeout=60):

    lyrics = generate_lyrics(prompt=lyricsPrompt)

    data = {
        "lyrics": lyrics,
        "model": model
    }

    if reference_id:
        data["reference_id"] = reference_id
    elif prompt:
        data["prompt"] = prompt
    else:
        raise ValueError("you must provide either a prompt or a reference_id")

    response = requests.post("https://api.mureka.ai/v1/song/generate", json=data, headers=headers)
    response.raise_for_status()
    result = response.json()

    task_id = result.get("id")
    if not task_id:
        raise Exception("No task ID returned.")

    print(f"Task submitted. Task ID: {task_id}")

    status_url = f"https://api.mureka.ai/v1/song/query/{task_id}"
    start_time = time.time()

    while True:
        time.sleep(poll_interval)
        poll_response = requests.get(status_url, headers=headers)

        try:
            poll_data = poll_response.json()
        except json.JSONDecodeError:
            print("Failed to parse poll response:", poll_response.text)
            continue

        status = poll_data.get("status")
        print(f"Task status: {status}")

        if status == "succeeded":
            choice = poll_data["choices"][0]
            flac_url = choice["flac_url"]
            lyrics_sections = choice["lyrics_sections"]

            full_lyrics = "\n".join(
                line["text"]
                for section in lyrics_sections
                for line in section.get("lines", [])
            )

            audio_data = requests.get(flac_url).content
            filename = "generated_song.flac"
            with open(filename, "wb") as f:
                f.write(audio_data)
            print(f"Song downloaded: {filename}")

            return full_lyrics, filename

        elif status == "failed":
            raise Exception(f"generation failed: {poll_data.get('failed_reason')}")

        elif time.time() - start_time > timeout:
            raise TimeoutError("timed out after waiting too long for the songGen_api")



# prompt = "r&b, slow, passionate, male vocal"

# full_lyrics, song_path = generate_song(lyrics, reference_id='74454136848388')




