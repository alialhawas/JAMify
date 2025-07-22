import { SpotifyProfile, SpotifyTrack, SpotifyArtist, UserStats, RecommendedTrack } from "@/types";
import { apiRequest } from "@/lib/queryClient";

// Function to get access token from URL params after backend callback redirect
export function getAccessTokenFromUrl(): { accessToken: string | null, expiresIn: number | null } {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token") || urlParams.get("token");
  const expiresIn = parseInt(urlParams.get("expires_in") || "3600");
  
  // Clear URL parameters after reading them
  if (accessToken) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
  
  return { accessToken, expiresIn: isNaN(expiresIn) ? null : expiresIn };
}

// Function to handle Spotify login
export function spotifyLogin() {
  window.location.href = "https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/login?user_id=user123";
}

// Function to refresh access token
export async function refreshAccessToken(spotifyId: string): Promise<string> {
  try {
    const response = await fetch(`https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/refresh?spotifyId=${spotifyId}&user_id=user123`);
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
    const response = await fetch("https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/user?user_id=user123", {
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
    const response = await fetch("https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/stats?user_id=user123", {
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
// Function to check if user data needs to be refreshed
export async function checkDataFreshness(accessToken: string): Promise<{shouldRefresh: boolean, lastFetchDate?: Date}> {
  try {
    const response = await fetch("https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/check-data-freshness?user_id=user123", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check data freshness: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      shouldRefresh: data.shouldRefresh,
      lastFetchDate: data.lastFetchDate ? new Date(data.lastFetchDate) : undefined
    };
  } catch (error) {
    console.error("Error checking data freshness:", error);
    // Default to refreshing data if check fails
    return { shouldRefresh: true };
  }
}

export async function getRecommendations(accessToken: string): Promise<RecommendedTrack[]> {
  try {
    const response = await fetch("https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/recommendations?user_id=user123", {
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
