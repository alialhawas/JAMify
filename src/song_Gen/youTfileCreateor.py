import os
import librosa
import numpy as np
import soundfile as sf
import yt_dlp

def download_audio(youtube_url, output_filename="input.mp3"):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'temp_audio.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])

    os.rename("temp_audio.mp3", output_filename)
    print(f"✅ Downloaded audio as {output_filename}")

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

    os.system(f"ffmpeg -y -loglevel quiet -i {temp_wav} {output_mp3}")
    os.remove(temp_wav)

    print(f"🎧 Best 30 seconds saved as {output_mp3}")

def download_songs_sample(youtube_url):
    input_mp3 = "input.mp3"
    output_mp3 = "best_30s.mp3"

    download_audio(youtube_url, input_mp3)
    find_best_30s(input_mp3, output_mp3)

    os.remove(input_mp3)

