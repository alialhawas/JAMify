import os
import io
import re
import librosa
import numpy as np
import soundfile as sf
import subprocess
import base64
import concurrent.futures

from pydub import AudioSegment

import yt_dlp
from yt_dlp.utils import DownloadError


def sanitize_filename(title):
    return re.sub(r'[\\/*?:"<>|]', "_", title)  

def download_audio(youtube_url):
    print("🔽 Fetching video info...")
    with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)
        title = sanitize_filename(info_dict.get('title', 'input'))

    output_filename = f"{title}.mp3"

    # ydl_opts = {
    #     'format': 'bestaudio/best',
    #     'outtmpl': 'temp_audio.%(ext)s',
    #     'postprocessors': [{
    #         'key': 'FFmpegExtractAudio',
    #         'preferredcodec': 'mp3',
    #         'preferredquality': '320',
    #     }],
    #     'quiet': True
    # }

    ydl_opts = {
    "format": "bestaudio[ext=m4a]/bestaudio/best",
    "quiet": True,
    "noplaylist": True,
    "outtmpl": "temp_audio.%(ext)s",
    "postprocessors": [{
        "key": "FFmpegExtractAudio",
        "preferredcodec": "mp3",
        "preferredquality": "320",
    }],
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "retries": 2,
    "ignoreerrors": True,
    }


    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])

    return output_filename


def find_best_30s(input_mp3, output_mp3, duration=30):
    y, sr = librosa.load(input_mp3, sr=None)
    frame_length = int(sr * 0.5)
    hop_length = int(sr * 0.25)

    energy = np.array([
        sum(abs(y[i:i+frame_length]**2))
        for i in range(0, len(y), hop_length)
    ])

    window_size = int((duration * sr) / hop_length)
    energy_sum = np.convolve(energy, np.ones(window_size), mode='valid')
    start_index = np.argmax(energy_sum)
    start_sample = start_index * hop_length
    end_sample = start_sample + duration * sr

    best_clip = y[start_sample:end_sample]
    temp_wav = "temp_best_30s.wav"
    sf.write(temp_wav, best_clip, sr)

    subprocess.run(["ffmpeg", "-y", "-loglevel", "quiet", "-i", temp_wav, output_mp3])
    os.remove(temp_wav)

    print(f"🎧 Best 30 seconds saved as {output_mp3}")
    return output_mp3


def find_best_30s_bytes(input_mp3_path, duration=30):
    y, sr = librosa.load(input_mp3_path, sr=None)
    frame_length = int(sr * 0.5)
    hop_length = int(sr * 0.25)

    energy = np.array([
        sum(abs(y[i:i+frame_length]**2))
        for i in range(0, len(y), hop_length)
    ])

    window_size = int((duration * sr) / hop_length)
    energy_sum = np.convolve(energy, np.ones(window_size), mode='valid')
    start_index = np.argmax(energy_sum)
    start_sample = start_index * hop_length
    end_sample = start_sample + duration * sr

    best_clip = y[start_sample:end_sample]

    wav_io = io.BytesIO()
    sf.write(wav_io, best_clip, sr, format='WAV')
    wav_io.seek(0)

    audio_segment = AudioSegment.from_wav(wav_io)
    mp3_io = io.BytesIO()
    audio_segment.export(mp3_io, format="mp3")
    mp3_io.seek(0)

    return mp3_io


def download_song_sample_bytes(youtube_url: str):
    input_mp3 = download_audio(youtube_url)
    mp3_buffer = find_best_30s_bytes(input_mp3)
    os.remove(input_mp3)

    return mp3_buffer

def download_song_sample_by_name(song_name: str, artist_name: str):
    query = f"{song_name} {artist_name}"
    with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
        search_result = ydl.extract_info(f"ytsearch:{query}", download=False)['entries'][0]
        youtube_url = f"https://www.youtube.com/watch?v={search_result['id']}"
        return download_song_sample_bytes(youtube_url)

def download_song_sample(youtube_url):
    input_mp3 = download_audio(youtube_url)
    base_name = os.path.splitext(input_mp3)[0]
    output_mp3 = f"{base_name}_30s.mp3"

    file_name = find_best_30s(input_mp3, output_mp3)
    os.remove(input_mp3)
    return file_name


def download_song_sample_by_name(song_name: str, artist_name: str):
    query = f"{song_name} {artist_name}"
    with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
        search_result = ydl.extract_info(f"ytsearch:{query}", download=False)['entries'][0]
        youtube_url = f"https://www.youtube.com/watch?v={search_result['id']}"
        return download_song_sample_bytes(youtube_url)


def download_song_sample_bytes(youtube_url):
    try:
        input_mp3 = download_audio(youtube_url)  # your function
        if not os.path.exists(input_mp3):
            return None

        mp3_buffer = find_best_30s_bytes(input_mp3)  # your function
        os.remove(input_mp3)
        return mp3_buffer

    except DownloadError as e:
        print(f"⚠️ Download error: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Processing error: {e}")
        return None




def load_clips(tracks, redis_con, batch_size=2, max_workers=10):
    def normalize_key(song_name, artist_name):
        return f"{song_name.strip().lower().replace(' ', '_')}:{artist_name.strip().lower().replace(' ', '_')}"

    def process_track(track):
        try:
            song_name = track["name"]
            artist_name = track["artists"][0]["name"]
            redis_key = normalize_key(song_name, artist_name)

            if redis_con.exists(redis_key):
                return f"⏭️ Skipped (already in Redis): {redis_key}"

            print(f"🎵 Downloading: {song_name} - {artist_name}")
            mp3_io = download_song_sample_by_name(song_name, artist_name)

            if mp3_io is None:
                return f"⚠️ Skipped (no audio): {redis_key}"

            b64_audio = base64.b64encode(mp3_io.read()).decode("utf-8")
            redis_con.set(redis_key, b64_audio)
            return f"✅ Saved: {redis_key}"

        except Exception as e:
            return f"❌ Error: {track.get('name', 'unknown')} - {e}"

    for i in range(0, len(tracks), batch_size):
        batch = tracks[i:i + batch_size]
        print(f"🔁 Processing batch {i // batch_size + 1} ({len(batch)} tracks)")

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(process_track, batch))
            for r in results:
                print(r)



# def load_clips(tracks, redis_con, batch_size=1, max_workers=20):
#     def process_track(track):
#         try:
#             song_name = track["name"]
#             artist_name = track["artists"][0]["name"]

#             print(f"🎵 Downloading: {song_name} - {artist_name}")
#             mp3_io = download_song_sample_by_name(song_name, artist_name)

#             if mp3_io is None:
#                 return f"⚠️ Skipped: {song_name} - {artist_name}"

#             b64_audio = base64.b64encode(mp3_io.read()).decode("utf-8")

#             redis_key = f"{song_name.strip().lower().replace(' ', '_')}:{artist_name.strip().lower().replace(' ', '_')}"

#             redis_con.set(redis_key, b64_audio)
#             return f"✅ Saved: {redis_key}"

#         except Exception as e:
#             return f"❌ Error: {track.get('name', 'unknown')} - {e}"

#     for i in range(0, len(tracks), batch_size):
#         batch = tracks[i:i+batch_size]
#         print(f"🔁 Processing batch {i // batch_size + 1} ({len(batch)} tracks)")

#         with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
#             results = list(executor.map(process_track, batch))
#             for r in results:
#                 print(r)


