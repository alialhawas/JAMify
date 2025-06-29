# import os
# import librosa
# import numpy as np
# import soundfile as sf
# import yt_dlp

# def download_audio(youtube_url, output_filename="input.mp3"):
#     ydl_opts = {
#         'format': 'bestaudio/best',
#         'outtmpl': 'temp_audio.%(ext)s',
#         'postprocessors': [{
#             'key': 'FFmpegExtractAudio',
#             'preferredcodec': 'mp3',
#             'preferredquality': '192',
#         }],
#         'quiet': True
#     }

#     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#         ydl.download([youtube_url])

#     os.rename("temp_audio.mp3", output_filename)
#     print(f"✅ Downloaded audio as {output_filename}")

# def find_best_30s(input_mp3, output_mp3, duration=30):
#     print("🔍 Analyzing audio for best 30-second segment...")
#     y, sr = librosa.load(input_mp3, sr=None)
#     frame_length = int(sr * 0.5)
#     hop_length = int(sr * 0.25)

#     energy = np.array([
#         sum(abs(y[i:i+frame_length]**2))
#         for i in range(0, len(y), hop_length)
#     ])

#     window_size = int((duration * sr) / hop_length)
#     energy_sum = np.convolve(energy, np.ones(window_size), mode='valid')
#     start_index = np.argmax(energy_sum)
#     start_sample = start_index * hop_length
#     end_sample = start_sample + duration * sr

#     best_clip = y[start_sample:end_sample]
#     temp_wav = "temp_best_30s.wav"
#     sf.write(temp_wav, best_clip, sr)

#     os.system(f"ffmpeg -y -loglevel quiet -i {temp_wav} {output_mp3}")
#     os.remove(temp_wav)

#     print(f"🎧 Best 30 seconds saved as {output_mp3}")

# def download_songs_sample(youtube_url):
#     input_mp3 = "input.mp3"
#     output_mp3 = "best_30s.mp3"

#     download_audio(youtube_url, input_mp3)
#     find_best_30s(input_mp3, output_mp3)

#     os.remove(input_mp3)


import os
import re
import librosa
import numpy as np
import soundfile as sf
import yt_dlp
import subprocess


def sanitize_filename(title):
    return re.sub(r'[\\/*?:"<>|]', "_", title)  

def download_audio(youtube_url):
    print("🔽 Fetching video info...")
    with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)
        title = sanitize_filename(info_dict.get('title', 'input'))

    output_filename = f"{title}.mp3"

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'temp_audio.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'quiet': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])

    os.rename("temp_audio.mp3", output_filename)
    print(f"done Downloaded audio as {output_filename}")
    return output_filename


def find_best_30s(input_mp3, output_mp3, duration=30):
    print("🔍 Analyzing audio for best 30-second segment...")
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
        file_name = download_song_sample(youtube_url)
    return file_name


# download_song_sample_by_name("love story", "Taylor Swift")

# download_song_sample('https://www.youtube.com/watch?v=k2qgadSvNyU')

