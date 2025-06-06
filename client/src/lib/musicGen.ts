import { GenerateMusicParams, GeneratedMusicResponse } from "@/types";
import { apiRequest } from "@/lib/queryClient";

// Function to generate music
export async function generateMusic(
  params: GenerateMusicParams,
  accessToken: string | null
): Promise<GeneratedMusicResponse> {
  try {
    const response = await apiRequest("POST", "/api/generate", params, accessToken);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to generate music:", error);
    throw new Error("Failed to generate music");
  }
}

// Helper function to format duration in seconds to MM:SS format
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// In a real implementation, we would have more functions related to processing
// and manipulating generated music. For now, let's create a placeholder function
// for potential future implementation.

// Function to get music variations (placeholder for future implementation)
export async function getMusicVariations(
  trackId: number,
  accessToken: string
): Promise<GeneratedMusicResponse[]> {
  try {
    // This would make an API call to a backend endpoint that generates variations
    // of an existing generated track
    throw new Error("Not implemented yet");
  } catch (error) {
    console.error("Failed to get music variations:", error);
    throw error;
  }
}

// Function to provide default parameters for music generation
export function getDefaultGenerationParams(): GenerateMusicParams {
  return {
    genre: "Electronic",
    mood: "Energetic",
    duration: 60
  };
}

// Function to get recommendations based on seed songs
export async function getRecommendationsFromSong(
  seedSongs: Array<{ name: string; year: number }>
): Promise<any[]> {
  try {
    const response = await fetch('http://localhost:5001/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        songs: seedSongs,
        n_songs: 5 
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}
