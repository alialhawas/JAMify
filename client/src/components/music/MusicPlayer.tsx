import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { formatDuration } from "@/lib/musicGen";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { AudioVisualizer } from "@/components/ui/audio-visualizer";
import { 
  SkipBackIcon, 
  SkipForwardIcon, 
  PlayIcon, 
  PauseIcon,
  HeartIcon,
  DownloadIcon,
  RefreshCwIcon,
  Wand2Icon,
  MusicIcon,
  ShareIcon
} from "lucide-react";

export function MusicPlayer() {
  const { playerState, pauseTrack, resumeTrack, updateProgress } = usePlayer();
  const { isPlaying, currentTrack, progress, duration, isGeneratedTrack } = playerState;
  
  const [regenerating, setRegenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);
  
  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    };
  }, []);
  
  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Failed to play audio:", err);
        pauseTrack();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, pauseTrack]);
  
  // Listen to audio time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      updateProgress(audio.currentTime);
    };
    
    const handleEnded = () => {
      updateProgress(duration);
      pauseTrack();
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [updateProgress, pauseTrack, duration]);
  
  // Track the current audio URL
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Reset progress and set audio source if track changes
  useEffect(() => {
    if (!currentTrack) return;
    
    let url: string | null = null;
    
    // Set the source based on the track type
    if (isGeneratedTrack) {
      const generatedTrack = currentTrack as any; // Use type assertion
      url = generatedTrack.audioUrl;
      console.log("Setting audio source for generated track:", url);
    } else {
      // Handle Spotify track preview if available
      const spotifyTrack = currentTrack as any;
      url = spotifyTrack.preview_url;
      console.log("Setting audio source for Spotify track:", url);
    }
    
    // Update the audio URL state
    if (url) {
      setAudioUrl(url);
    }
    
    updateProgress(0);
  }, [currentTrack, isGeneratedTrack, updateProgress]);
  
  // Handle audio element source and playback
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    
    // Set the audio source
    console.log("Setting audio element source:", audioUrl);
    audioRef.current.src = audioUrl;
    audioRef.current.load(); // Force reload the audio
    
    // Log the audio element state
    console.log("Audio element after source set:", {
      src: audioRef.current.src,
      paused: audioRef.current.paused,
      duration: audioRef.current.duration,
      readyState: audioRef.current.readyState
    });
    
    // If it should be playing, attempt to play after a short delay
    if (isPlaying) {
      const playPromise = setTimeout(() => {
        if (audioRef.current) {
          console.log("Attempting to play track");
          audioRef.current.play().catch(err => {
            console.error("Failed to play track:", err);
            pauseTrack();
          });
        }
      }, 300);
      
      return () => clearTimeout(playPromise);
    }
  }, [audioUrl, isPlaying, pauseTrack]);
  
  if (!currentTrack || !isGeneratedTrack) return null;
  
  const trackDetails = currentTrack as any;
  const progressPercentage = (progress / duration) * 100;
  
  const handleRegenerate = () => {
    setRegenerating(true);
    // In a real app, this would call the regeneration API
    setTimeout(() => setRegenerating(false), 2000);
  };
  
  return (
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6">
      {/* Audio element for playback */}
      <audio 
        ref={audioRef} 
        preload="auto" 
        controls
        className="w-full mb-4" 
        onLoadedData={() => console.log("Audio loaded successfully")}
        onCanPlay={() => console.log("Audio can play now")}
        onError={(e) => console.error("Audio error:", e.currentTarget.error)}
      />
      
      <div className="flex flex-col md:flex-row items-center mb-6">
        <div className="w-full md:w-1/3 mb-4 md:mb-0 md:mr-6">
          <div className="bg-[#282828] rounded-lg h-48 flex items-center justify-center relative overflow-hidden">
            <AudioVisualizer playing={isPlaying} className="absolute" />
          </div>
        </div>
        
        <div className="w-full md:w-2/3">
          <h3 className="font-bold text-lg mb-2">{trackDetails.title}</h3>
          <p className="text-[#B3B3B3] text-sm mb-4">
            Generated based on your {trackDetails.genre.toLowerCase()} music preferences
          </p>
          
          <div className="mb-4">
            <div className="h-1 w-full bg-[#282828] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1DB954]" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[#B3B3B3] text-xs mt-1">
              <span>{formatDuration(progress)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <button className="text-white mr-4">
                <SkipBackIcon size={24} />
              </button>
              <button 
                className="bg-white text-[#121212] rounded-full h-10 w-10 flex items-center justify-center"
                onClick={isPlaying ? pauseTrack : resumeTrack}
              >
                {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              </button>
              <button className="text-white ml-4">
                <SkipForwardIcon size={24} />
              </button>
            </div>
            
            <div>
              <button className="text-white mr-2">
                <HeartIcon size={20} />
              </button>
              <button className="text-white">
                <DownloadIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between">
        <SpotifyButton
          onClick={handleRegenerate}
          variant="outline"
          className="bg-[#121212] bg-opacity-50 hover:bg-opacity-70 mb-2"
          icon={<RefreshCwIcon size={16} />}
          disabled={regenerating}
        >
          {regenerating ? "Regenerating..." : "Regenerate"}
        </SpotifyButton>
        
        <SpotifyButton
          variant="outline"
          className="bg-[#121212] bg-opacity-50 hover:bg-opacity-70 mb-2"
          icon={<Wand2Icon size={16} />}
        >
          Variations
        </SpotifyButton>
        
        <SpotifyButton
          variant="outline"
          className="bg-[#121212] bg-opacity-50 hover:bg-opacity-70 mb-2"
          icon={<MusicIcon size={16} />}
        >
          Find Similar
        </SpotifyButton>
        
        <SpotifyButton
          variant="outline"
          className="bg-[#121212] bg-opacity-50 hover:bg-opacity-70 mb-2"
          icon={<ShareIcon size={16} />}
        >
          Share
        </SpotifyButton>
      </div>
    </div>
  );
}
