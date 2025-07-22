// JAMIFY API Client for localhost:8000 endpoints

const JAMIFY_API_BASE = "https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000";

export interface JamifySong {
  name: string;
  year: number;
}

export interface JamifyRecommendationRequest {
  songs: JamifySong[];
  n_songs: number;
}

export interface JamifyRecommendationResponse {
  recommendations: Array<{
    name: string;
    year: number;
    artists: string | string[];
  }>;
}

export interface JamifyGenerateSongRequest {
  lyric_prompt: string;
  song_prompt?: string;
  youTube_link?: string;
}

export interface JamifyGeneratedSong {
  id: string;
  title: string;
  lyrics: string;
  audio_url?: string;
  style?: string;
}

export interface JamifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity: number;
}

export interface JamifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  popularity: number;
  duration_ms: number;
}

// Health check
export async function checkJamifyHealth(): Promise<{ status: string }> {
  const response = await fetch(`${JAMIFY_API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

// Get song recommendations
export async function getJamifyRecommendations(request: JamifyRecommendationRequest): Promise<JamifyRecommendationResponse> {
  const requestWithUserId = {
    ...request,
    user_id: "user123"
  };
  
  const response = await fetch(`${JAMIFY_API_BASE}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestWithUserId),
  });
  
  if (!response.ok) {
    throw new Error(`Recommendation request failed: ${response.status}`);
  }
  
  return response.json();
}

// Generate a song
export async function generateJamifySong(request: JamifyGenerateSongRequest): Promise<JamifyGeneratedSong> {
  const requestWithUserId = {
    ...request,
    user_id: "user123"
  };
  
  const response = await fetch(`${JAMIFY_API_BASE}/genSong`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestWithUserId),
  });
  
  if (!response.ok) {
    throw new Error(`Song generation failed: ${response.status}`);
  }
  
  return response.json();
}

// Login to Spotify
export async function jamifySpotifyLogin(): Promise<{ login_url: string }> {
  const response = await fetch(`${JAMIFY_API_BASE}/login`);
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  return response.json();
}


export async function getJamifyTopArtists(accessToken: string, period: string): Promise<JamifyArtist[]> {
  const response = await fetch(`${JAMIFY_API_BASE}/top-artists?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Top artists request failed: ${response.status}`);
  }
  
  return response.json();
}


// Get user's top tracks
export async function getJamifyTopTracks(accessToken: string): Promise<JamifyTrack[]> {
  const response = await fetch(`${JAMIFY_API_BASE}/top-tracks?user_id=user123`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Top tracks request failed: ${response.status}`);
  }
  
  return response.json();
}