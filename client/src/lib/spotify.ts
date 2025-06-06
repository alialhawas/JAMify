import { SpotifyProfile, SpotifyTrack, SpotifyArtist, UserStats, RecommendedTrack } from "@/types";
import { apiRequest } from "@/lib/queryClient";

// Function to get access token from URL params after Spotify login redirect
export function getAccessTokenFromUrl(): { accessToken: string | null, expiresIn: number | null } {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token");
  const expiresIn = parseInt(urlParams.get("expires_in") || "0");
  
  // Clear URL parameters after reading them
  if (accessToken) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
  
  return { accessToken, expiresIn: isNaN(expiresIn) ? null : expiresIn };
}

// Function to handle Spotify login
export function spotifyLogin() {
  window.location.href = "/api/auth/login";
}

// Function to refresh access token
export async function refreshAccessToken(spotifyId: string): Promise<string> {
  try {
    const response = await apiRequest("GET", `/api/auth/refresh?spotifyId=${spotifyId}`, undefined);
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw new Error("Failed to refresh access token");
  }
}

// Function to get user profile data
export async function getUserProfile(accessToken: string): Promise<SpotifyProfile> {
  try {
    const response = await fetch("/api/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

// Function to get user statistics
export async function getUserStats(accessToken: string): Promise<UserStats> {
  try {
    const response = await fetch("/api/stats", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
}

// Function to get recommendations
export async function getRecommendations(accessToken: string): Promise<RecommendedTrack[]> {
  try {
    const response = await fetch("/api/recommendations", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
}
