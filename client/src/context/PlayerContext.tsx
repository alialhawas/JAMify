import { createContext, useState, useContext, ReactNode } from "react";
import { PlayerState, SpotifyTrack, GeneratedMusicResponse } from "@/types";

interface PlayerContextType {
  playerState: PlayerState;
  playTrack: (track: SpotifyTrack | GeneratedMusicResponse) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  updateProgress: (progress: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    progress: 0,
    duration: 0,
    isGeneratedTrack: false
  });

  // The isGeneratedTrack property is now included in the playerState

  const playTrack = (track: SpotifyTrack | GeneratedMusicResponse) => {
    // For Spotify tracks
    if ('duration_ms' in track) {
      setPlayerState({
        isPlaying: true,
        currentTrack: track,
        progress: 0,
        duration: track.duration_ms / 1000, // Convert to seconds
        isGeneratedTrack: false
      });
    } 
    // For generated tracks
    else {
      setPlayerState({
        isPlaying: true,
        currentTrack: track,
        progress: 0,
        duration: track.duration,
        isGeneratedTrack: true
      });
    }
  };

  const pauseTrack = () => {
    setPlayerState(prevState => ({
      ...prevState,
      isPlaying: false
    }));
  };

  const resumeTrack = () => {
    setPlayerState(prevState => ({
      ...prevState,
      isPlaying: true
    }));
  };

  const updateProgress = (progress: number) => {
    setPlayerState(prevState => ({
      ...prevState,
      progress
    }));
  };

  // These are placeholders for functionality that would require deeper Spotify integration
  const skipNext = () => {
    console.log("Skip next - would implement with actual Spotify SDK");
  };

  const skipPrevious = () => {
    console.log("Skip previous - would implement with actual Spotify SDK");
  };

  const value = {
    playerState,
    playTrack,
    pauseTrack,
    resumeTrack,
    skipNext,
    skipPrevious,
    updateProgress
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
