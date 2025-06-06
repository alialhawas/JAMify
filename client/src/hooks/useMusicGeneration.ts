import { useState } from "react";
import { useSpotify } from "@/context/SpotifyContext";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/hooks/use-toast";
import { generateMusic, getDefaultGenerationParams } from "@/lib/musicGen";
import { GenerateMusicParams, GeneratedMusicResponse } from "@/types";

export function useMusicGeneration() {
  const { accessToken, isAuthenticated } = useSpotify();
  const { playTrack } = usePlayer();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedMusicResponse | null>(null);
  const [generationParams, setGenerationParams] = useState<GenerateMusicParams>(getDefaultGenerationParams());
  
  // Update generation parameters
  const updateParams = (params: Partial<GenerateMusicParams>) => {
    setGenerationParams(prev => ({ ...prev, ...params }));
  };
  
  // Generate music with current parameters
  const generate = async () => {
    setIsGenerating(true);
    
    try {
      // Use access token if available, otherwise use null to indicate no auth
      const track = await generateMusic(generationParams, accessToken);
      
      // Log the track data for debugging
      console.log("Generated track data:", track);
      
      // Check if audioUrl is valid
      if (!track.audioUrl) {
        console.error("No audio URL provided in the response");
        throw new Error("Generated track doesn't have a valid audio URL");
      }
      
      // Test if the URL is accessible
      try {
        const response = await fetch(track.audioUrl, { method: 'HEAD' });
        console.log("Audio URL check response:", response.status, response.statusText);
        if (!response.ok) {
          console.warn("Audio URL might not be accessible:", track.audioUrl);
        }
      } catch (urlError) {
        console.warn("Couldn't verify audio URL:", urlError);
      }
      
      setGeneratedTrack(track);
      playTrack(track);
      
      toast({
        title: "Music Generated",
        description: `"${track.title}" has been created based on your preferences.`,
      });
    } catch (error) {
      console.error("Failed to generate music:", error);
      toast({
        title: "Generation Failed",
        description: "We couldn't generate music. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Regenerate with same parameters
  const regenerate = async () => {
    setGeneratedTrack(null);
    await generate();
  };
  
  // Reset parameters to defaults
  const resetParams = () => {
    setGenerationParams(getDefaultGenerationParams());
  };
  
  return {
    isGenerating,
    generatedTrack,
    generationParams,
    updateParams,
    generate,
    regenerate,
    resetParams
  };
}
