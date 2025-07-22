import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, Volume2Icon } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  src: string | null;
  trackName: string;
  artistName: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export function AudioPlayer({ src, trackName, artistName, onPlay, onPause, className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Mock 30-second preview
  const [volume, setVolume] = useState(0.7);
  const [demoProgress, setDemoProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPause?.();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPause]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const startDemoPlayback = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    onPlay?.();
    
    // Simulate 30-second playback
    demoIntervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 0.1;
        if (newTime >= 30) {
          setIsPlaying(false);
          setCurrentTime(0);
          onPause?.();
          if (demoIntervalRef.current) {
            clearInterval(demoIntervalRef.current);
          }
          return 0;
        }
        return newTime;
      });
    }, 100);
  };

  const stopDemoPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPause?.();
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      if (src && audio) {
        audio.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        stopDemoPlayback();
      }
      return;
    }

    if (src && audio) {
      try {
        // Reset current time if at the end
        if (audio.currentTime >= audio.duration) {
          audio.currentTime = 0;
        }
        
        console.log('Attempting to play audio from:', src);
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          onPlay?.();
          console.log('Audio started playing successfully');
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        console.log('Audio element state:', {
          readyState: audio.readyState,
          networkState: audio.networkState,
          src: audio.src,
          currentSrc: audio.currentSrc
        });
        
        // Show user-friendly message for autoplay restrictions
        const errorMessage = error instanceof DOMException ? error.name : 'unknown';
        if (errorMessage === 'NotAllowedError') {
          console.log('Autoplay was prevented by browser policy');
        }
        
        // Fallback to demo mode if real audio fails
        startDemoPlayback();
      }
    } else {
      startDemoPlayback();
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!src || !audio || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-gray-900/50 rounded-lg p-4 ${className}`}>
      {src && (
        <audio 
          ref={audioRef} 
          src={src} 
          preload="metadata"
          onError={(e) => {
            console.error('Audio loading error:', e.currentTarget.error);
            console.log('Failed to load audio from:', src);
          }}
          onCanPlay={() => console.log('Audio can play:', src)}
          onLoadedData={() => console.log('Audio loaded:', src)}
        />
      )}
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate">{trackName}</h4>
          <p className="text-xs text-gray-400 truncate">{artistName}</p>
        </div>
        <Button
          onClick={togglePlay}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white ml-3"
          disabled={!src && !isPlaying}
        >
          {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 min-w-[3rem]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 min-w-[3rem]">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Volume2Icon className="w-3 h-3 text-gray-400" />
          <Slider
            value={[volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-16"
          />
        </div>
      </div>
    </div>
  );
}