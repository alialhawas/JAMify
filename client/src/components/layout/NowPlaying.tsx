import { usePlayer } from "@/context/PlayerContext";
import { formatDuration } from "@/lib/musicGen";
import { 
  SkipBackIcon, 
  SkipForwardIcon, 
  PlayIcon, 
  PauseIcon 
} from "lucide-react";

export function NowPlaying() {
  const { playerState, playTrack, pauseTrack, resumeTrack, skipNext, skipPrevious } = usePlayer();
  
  const { isPlaying, currentTrack, progress, duration, isGeneratedTrack } = playerState;
  
  if (!currentTrack) return null;
  
  // Extract track details based on track type
  const trackName = isGeneratedTrack 
    ? (currentTrack as any).title 
    : (currentTrack as any).name;
    
  const artistName = isGeneratedTrack 
    ? `AI Generated - ${(currentTrack as any).genre}` 
    : (currentTrack as any).artists?.[0]?.name || 'Unknown Artist';
    
  const imageUrl = isGeneratedTrack 
    ? undefined 
    : (currentTrack as any).album?.images?.[0]?.url;
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#282828] border-t border-[#333333] p-4 flex items-center">
      <div className="flex-shrink-0 mr-4">
        <div className="w-12 h-12 rounded bg-[#333333] flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Now playing" className="w-full h-full rounded object-cover" />
          ) : (
            <div className="text-[#1DB954]">
              <span className="text-2xl">♪</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-grow">
        <div className="text-sm font-medium truncate">{trackName}</div>
        <div className="text-[#B3B3B3] text-xs truncate">{artistName}</div>
      </div>
      
      <div className="flex items-center">
        <button 
          onClick={skipPrevious} 
          className="text-white mx-2"
        >
          <SkipBackIcon size={16} />
        </button>
        
        <button 
          onClick={isPlaying ? pauseTrack : resumeTrack} 
          className="bg-white text-black rounded-full h-8 w-8 flex items-center justify-center mx-2"
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        
        <button 
          onClick={skipNext} 
          className="text-white mx-2"
        >
          <SkipForwardIcon size={16} />
        </button>
      </div>
    </div>
  );
}
