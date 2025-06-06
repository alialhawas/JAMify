import { useMusicGeneration } from "@/hooks/useMusicGeneration";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/musicGen";
import { useState } from "react";
import { Music2Icon, RefreshCwIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePlayer } from "@/context/PlayerContext";

export function MusicGenerator() {
  const { 
    isGenerating, 
    generatedTrack, 
    generationParams, 
    updateParams, 
    generate, 
    regenerate
  } = useMusicGeneration();
  
  const { isAuthenticated, login } = useSpotifyOperations();
  const { playTrack } = usePlayer();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  const genreOptions = [
    "Electronic", "Hip Hop", "Pop", "Rock", "Ambient"
  ];
  
  const moodOptions = [
    "Energetic", "Chill", "Melancholic", "Happy", "Dark"
  ];
  
  const handleGenerate = () => {
    // No authentication check needed, the generate function now works without authentication
    generate();
  };
  
  return (
    <>
      <div className="bg-[#282828] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Music Generator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[#B3B3B3] text-sm mb-2">Genre Base</label>
            <Select 
              value={generationParams.genre} 
              onValueChange={(value) => updateParams({ genre: value })}
              disabled={isGenerating}
            >
              <SelectTrigger className="bg-[#121212] border-[#333333] px-4 py-3 focus:ring-[#1DB954]">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent className="bg-[#282828] border-[#333333]">
                {genreOptions.map(genre => (
                  <SelectItem key={genre} value={genre} className="text-white focus:bg-[#333333]">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-[#B3B3B3] text-sm mb-2">Mood</label>
            <Select 
              value={generationParams.mood} 
              onValueChange={(value) => updateParams({ mood: value })}
              disabled={isGenerating}
            >
              <SelectTrigger className="bg-[#121212] border-[#333333] px-4 py-3 focus:ring-[#1DB954]">
                <SelectValue placeholder="Select a mood" />
              </SelectTrigger>
              <SelectContent className="bg-[#282828] border-[#333333]">
                {moodOptions.map(mood => (
                  <SelectItem key={mood} value={mood} className="text-white focus:bg-[#333333]">
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-[#B3B3B3] text-sm mb-2">Inspiration (Optional)</label>
          <Input 
            type="text" 
            placeholder="e.g., Daft Punk meets Tame Impala" 
            value={generationParams.inspiration || ""}
            onChange={(e) => updateParams({ inspiration: e.target.value })}
            className="bg-[#121212] border-[#333333] px-4 py-3 focus:ring-[#1DB954]"
            disabled={isGenerating}
          />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center text-[#B3B3B3] text-sm mb-2">
            <label>Duration</label>
            <span>{formatDuration(generationParams.duration)}</span>
          </div>
          <Slider 
            min={30} 
            max={180} 
            step={1}
            value={[generationParams.duration]} 
            onValueChange={(value) => updateParams({ duration: value[0] })}
            className="accent-[#1DB954]"
            disabled={isGenerating}
          />
        </div>
        
        <SpotifyButton
          onClick={handleGenerate}
          className="w-full py-3 font-semibold"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Track"}
        </SpotifyButton>
      </div>
      
      {/* Generated Track Result */}
      {generatedTrack && (
        <div className="bg-[#282828] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Generated Track</h2>
          
          <div className="bg-gradient-to-tr from-[#1DB954]/20 to-[#0969da]/20 rounded-lg p-5 mb-4">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-[#121212] rounded-md flex items-center justify-center mr-3">
                <Music2Icon className="text-[#1DB954]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{generatedTrack.title}</h3>
                <p className="text-sm text-[#B3B3B3]">{generatedTrack.genre} • {generatedTrack.mood}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#B3B3B3]">
                <p>{formatDuration(generatedTrack.duration)}</p>
                {generatedTrack.inspiration && (
                  <p className="mt-1">Inspired by: {generatedTrack.inspiration}</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <SpotifyButton 
                  onClick={() => playTrack(generatedTrack)} 
                  size="sm"
                >
                  Play
                </SpotifyButton>
                <SpotifyButton 
                  onClick={regenerate} 
                  size="sm" 
                  variant="outline"
                  disabled={isGenerating}
                  icon={<RefreshCwIcon className="w-4 h-4 mr-1" />}
                >
                  Regenerate
                </SpotifyButton>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#333333] pt-4 text-[#B3B3B3] text-sm">
            <p>
              AI generated music based on your preferences. The audio is streamed from a Spotify preview track that matches your selected parameters.
            </p>
          </div>
        </div>
      )}
      
      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="bg-[#282828] border-[#333333] max-w-md">
          <DialogTitle className="text-xl font-bold">Authentication Required</DialogTitle>
          <div className="p-4 text-center">
            <p className="mb-6 text-[#B3B3B3]">
              Please connect your Spotify account to generate music.
            </p>
            <SpotifyButton onClick={login} className="w-full">
              Connect with Spotify
            </SpotifyButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
