import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertUserSchema, insertGeneratedTrackSchema } from "@shared/schema";
import { randomUUID } from "crypto";

// Constants for Spotify API
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5000/api/auth/callback";

// if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
//   console.error("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.");
// }

export async function registerRoutes(app: Express): Promise<Server> {
  // SPOTIFY AUTH ROUTES
  app.get("/api/auth/login", (req, res) => {
    const state = randomUUID();
    const scope = "user-read-private user-read-email user-top-read user-read-recently-played user-library-read";
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
      state
    });
    
    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
  });
  
  app.get("/api/auth/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: "Authorization code missing" });
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await axios({
        method: "post",
        url: "https://accounts.spotify.com/api/token",
        params: {
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code"
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`
        }
      });
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get user profile
      const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${access_token}` }
      });
      
      const profile = profileResponse.data;
      const expiration = new Date();
      expiration.setSeconds(expiration.getSeconds() + expires_in);
      
      // Check if user exists
      const existingUser = await storage.getUserBySpotifyId(profile.id);
      
      if (existingUser) {
        // Update existing user
        await storage.updateUser({
          ...existingUser,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiration,
          displayName: profile.display_name,
          avatarUrl: profile.images[0]?.url,
          email: profile.email
        });
      } else {
        // Create new user
        await storage.createUser({
          username: profile.display_name || profile.id,
          spotifyId: profile.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiration,
          displayName: profile.display_name,
          avatarUrl: profile.images[0]?.url,
          email: profile.email
        });
      }
      
      // Redirect to frontend with tokens
      res.redirect(`/?access_token=${access_token}&expires_in=${expires_in}`);
      
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization failed" });
    }
  });
  
  app.get("/api/auth/refresh", async (req, res) => {
    const { spotifyId } = req.query;
    
    if (!spotifyId) {
      return res.status(400).json({ message: "Spotify ID required" });
    }
    
    try {
      const user = await storage.getUserBySpotifyId(spotifyId as string);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if token is expired
      const now = new Date();
      if (user.expiresAt > now) {
        return res.json({ 
          access_token: user.accessToken,
          expires_at: user.expiresAt 
        });
      }
      
      // Token is expired, refresh it
      const response = await axios({
        method: "post",
        url: "https://accounts.spotify.com/api/token",
        params: {
          grant_type: "refresh_token",
          refresh_token: user.refreshToken
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`
        }
      });
      
      const { access_token, expires_in } = response.data;
      
      // Update user with new token
      const expiration = new Date();
      expiration.setSeconds(expiration.getSeconds() + expires_in);
      
      await storage.updateUser({
        ...user,
        accessToken: access_token,
        expiresAt: expiration
      });
      
      res.json({ 
        access_token,
        expires_at: expiration 
      });
      
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });
  
  // USER PROFILE
  app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  // CHECK DATA FRESHNESS
  app.get("/api/check-data-freshness", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      // Get user profile to identify the user
      const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const spotifyId = profileResponse.data.id;
      
      // Find user by Spotify ID
      const user = await storage.getUserBySpotifyId(spotifyId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if data needs refresh (default 3 days)
      const shouldRefresh = await storage.shouldRefreshUserData(user.id, 3);
      
      res.json({ 
        shouldRefresh,
        lastFetchDate: user.lastDataFetch
      });
    } catch (error) {
      console.error("Error checking data freshness:", error);
      res.status(500).json({ message: "Failed to check data freshness" });
    }
  });

  // USER STATS
  app.get("/api/stats", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      // Get top artists
      const topArtistsResponse = await axios.get("https://api.spotify.com/v1/me/top/artists", {
        headers: { "Authorization": `Bearer ${token}` },
        params: { limit: 10, time_range: "medium_term" }
      });
      
      // Get top tracks
      const topTracksResponse = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
        headers: { "Authorization": `Bearer ${token}` },
        params: { limit: 50, time_range: "medium_term" }
      });
      
      // Process data to get genre distribution
      const allGenres = topArtistsResponse.data.items.flatMap((artist: any) => artist.genres);
      const genreCounts: Record<string, number> = {};
      
      allGenres.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
      
      // Sort and limit genres
      const topGenres = Object.entries(genreCounts)
        .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
        .slice(0, 4)
        .map(([name, count], index) => {
          const total = allGenres.length;
          const percentage = Math.round((count as number) / total * 100);
          
          // Assign colors
          const colors = ["#3b82f6", "#9333ea", "#10b981", "#eab308"];
          
          return {
            name,
            percentage,
            color: colors[index]
          };
        });
      
      // Format top artists
      const topArtists = topArtistsResponse.data.items.slice(0, 3).map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url,
        playCount: Math.floor(Math.random() * 100) + 50 // This would be real data in a full implementation
      }));
      
      // Create dummy listening activity for the week
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const listeningActivity = days.map(day => ({
        day,
        count: Math.floor(Math.random() * 80) + 20
      }));
      
      // Generate mood analysis based on audio features (would use actual audio features in a full implementation)
      const moodAnalysis = {
        energetic: Math.random() * 0.8 + 0.2,
        happy: Math.random() * 0.8 + 0.2,
        relaxed: Math.random() * 0.8 + 0.2,
        calm: Math.random() * 0.8 + 0.2,
        sad: Math.random() * 0.8 + 0.2,
        intense: Math.random() * 0.8 + 0.2
      };
      
      // Get user by Spotify ID to update their last data fetch time
      const meResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const spotifyId = meResponse.data.id;
      const user = await storage.getUserBySpotifyId(spotifyId);
      
      if (user) {
        // Update the user's last data fetch time
        await storage.updateUserDataFetchTime(user.id);
        
        // Save the stats to the database
        await storage.saveUserStats({
          userId: user.id,
          topGenres,
          topArtists,
          listeningActivity,
          moodAnalysis
        });
      }
      
      // Return the structured user stats with the fetched timestamp
      res.json({
        topGenres,
        topArtists,
        listeningActivity,
        moodAnalysis,
        lastFetchDate: new Date()
      });
      
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // RECOMMENDATIONS
  app.get("/api/recommendations", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      // Get user by Spotify ID to check cache freshness
      const meResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const spotifyId = meResponse.data.id;
      const user = await storage.getUserBySpotifyId(spotifyId);
      
      if (user) {
        // Check if we have cached recommendations and if the data is fresh
        const shouldRefresh = await storage.shouldRefreshUserData(user.id, 3);
        const cachedRecommendations = await storage.getUserRecommendations(user.id);
        
        if (!shouldRefresh && cachedRecommendations && cachedRecommendations.tracks) {
          console.log("Using cached recommendations from", cachedRecommendations.createdAt);
          return res.json(cachedRecommendations.tracks);
        }
      }
      
      // Get user's top tracks
      const topTracksResponse = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
        headers: { "Authorization": `Bearer ${token}` },
        params: { limit: 5 }
      });
      
      const seedTracks = topTracksResponse.data.items
        .slice(0, 5)
        .map((track: any) => track.id)
        .join(",");
      
      // Get recommendations
      const recommendationsResponse = await axios.get("https://api.spotify.com/v1/recommendations", {
        headers: { "Authorization": `Bearer ${token}` },
        params: {
          seed_tracks: seedTracks,
          limit: 8
        }
      });
      
      const recommendations = recommendationsResponse.data.tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        imageUrl: track.album.images[0]?.url
      }));
      
      // If we have a user, update their last data fetch time and store recommendations
      if (user) {
        // Update the user's last data fetch time
        await storage.updateUserDataFetchTime(user.id);
        
        // Save the recommendations to the database
        await storage.saveUserRecommendations({
          userId: user.id,
          tracks: recommendations
        });
      }
      
      res.json(recommendations);
      
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  
  // MUSIC GENERATION
  const generateMusicSchema = z.object({
    genre: z.string(),
    mood: z.string(),
    inspiration: z.string().optional(),
    duration: z.number().min(30).max(180)
  });
  
  app.post("/api/generate", async (req, res) => {
    const authHeader = req.headers.authorization;
    let token = null;
    let user = null;
    
    // If authentication is provided, validate it and get the user
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      
      try {
        // Try to get user info if authenticated
        const userResponse = await axios.get("https://api.spotify.com/v1/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const spotifyId = userResponse.data.id;
        user = await storage.getUserBySpotifyId(spotifyId);
      } catch (error) {
        console.error("Error getting user:", error);
        // We'll continue without authentication
        token = null;
      }
    }
    
    try {
      const validatedData = generateMusicSchema.parse(req.body);
      
      // Generate a seed track based on genre and mood
      let seedQuery = `${validatedData.genre} ${validatedData.mood}`;
      if (validatedData.inspiration) {
        seedQuery += ` ${validatedData.inspiration}`;
      }
      
      // Generate title based on genre, mood, and inspiration
      const adjectives = ["Cosmic", "Eternal", "Vibrant", "Midnight", "Electric", "Radiant"];
      const nouns = ["Waves", "Journey", "Dreams", "Horizon", "Echo", "Vision"];
      
      const title = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
      
      // Default audio URL - using a publicly available sample for testing
      // Using NASA sounds from a public domain source
      const sampleAudios = [
        "https://www.nasa.gov/wp-content/uploads/2015/01/spinning-pulsar.mp3",
        "https://www.nasa.gov/wp-content/uploads/2015/01/plasma-frequency-fluctuations.mp3",
        "https://www.nasa.gov/wp-content/uploads/2015/01/whistler-waves.mp3"
      ];
      
      // Select a random sample
      let audioUrl = sampleAudios[Math.floor(Math.random() * sampleAudios.length)];
      
      // If we have a token, try to get a relevant audio from Spotify
      if (token) {
        try {
          // Search Spotify for a track matching the seed criteria
          const searchResponse = await axios.get("https://api.spotify.com/v1/search", {
            headers: { "Authorization": `Bearer ${token}` },
            params: {
              q: seedQuery,
              type: "track",
              limit: 1
            }
          });
          
          if (searchResponse.data.tracks?.items?.length > 0 && searchResponse.data.tracks.items[0].preview_url) {
            audioUrl = searchResponse.data.tracks.items[0].preview_url;
          }
        } catch (error) {
          console.error("Error searching Spotify:", error);
          // Continue with default audio URL
        }
      }
      
      // Create a response object
      const generatedTrackResponse = {
        id: Math.floor(Math.random() * 10000), // Generate a random ID if not stored
        title,
        genre: validatedData.genre,
        mood: validatedData.mood,
        duration: validatedData.duration,
        inspiration: validatedData.inspiration,
        audioUrl
      };
      
      // If user is authenticated, store the track
      if (user) {
        const generatedTrack = await storage.createGeneratedTrack({
          userId: user.id,
          title,
          genre: validatedData.genre,
          mood: validatedData.mood,
          duration: validatedData.duration,
          inspiration: validatedData.inspiration,
          audioUrl
        });
        
        generatedTrackResponse.id = generatedTrack.id;
      }
      
      // Return the generated track info
      res.json(generatedTrackResponse);
      
    } catch (error) {
      console.error("Error generating music:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to generate music" });
    }
  });
  
  // SONG RECOMMENDATIONS ENDPOINT
  app.post("/api/recommendations/custom", async (req, res) => {
    try {
      const { seedSongs } = req.body;
      
      if (!Array.isArray(seedSongs) || seedSongs.length === 0) {
        return res.status(400).json({ message: "Invalid seed songs" });
      }
      
      // We'll use the Python recommendation engine in a real implementation
      // For now, we'll simulate recommendations with predefined data
      
      // Enhance recommendation data with more metadata
      const getRecommendations = (seedSong: { name: string; year: number }) => {
        // Simulate different recommendations based on the decade
        const decade = Math.floor(seedSong.year / 10) * 10;
        
        let recommendations = [];
        
        if (decade >= 2010) {
          // Modern music recommendations
          recommendations = [
            {
              "name": "Blinding Lights",
              "year": 2020,
              "artists": ["The Weeknd"],
              "genres": ["pop", "r&b", "synthwave"],
              "popularity": 95,
              "energy": 0.73,
              "danceability": 0.799
            },
            {
              "name": "Dance Monkey",
              "year": 2019,
              "artists": ["Tones and I"],
              "genres": ["pop", "dance"],
              "popularity": 92,
              "energy": 0.588,
              "danceability": 0.824
            },
            {
              "name": "Watermelon Sugar",
              "year": 2020,
              "artists": ["Harry Styles"],
              "genres": ["pop", "rock"],
              "popularity": 91,
              "energy": 0.548,
              "danceability": 0.548
            },
            {
              "name": "Don't Start Now",
              "year": 2019,
              "artists": ["Dua Lipa"],
              "genres": ["pop", "dance"],
              "popularity": 90,
              "energy": 0.793,
              "danceability": 0.794
            },
            {
              "name": "Bad Guy",
              "year": 2019,
              "artists": ["Billie Eilish"],
              "genres": ["pop", "alternative"],
              "popularity": 89,
              "energy": 0.425,
              "danceability": 0.701
            }
          ];
        } else if (decade >= 2000) {
          // 2000s recommendations
          recommendations = [
            {
              "name": "Uptown Funk",
              "year": 2014,
              "artists": ["Mark Ronson", "Bruno Mars"],
              "genres": ["pop", "funk", "disco"],
              "popularity": 87,
              "energy": 0.929,
              "danceability": 0.859
            },
            {
              "name": "Rolling in the Deep",
              "year": 2011,
              "artists": ["Adele"],
              "genres": ["pop", "soul"],
              "popularity": 85,
              "energy": 0.73,
              "danceability": 0.75
            },
            {
              "name": "Toxic",
              "year": 2003,
              "artists": ["Britney Spears"],
              "genres": ["pop", "dance"],
              "popularity": 83,
              "energy": 0.76,
              "danceability": 0.805
            },
            {
              "name": "Hey Ya!",
              "year": 2003,
              "artists": ["OutKast"],
              "genres": ["hip hop", "funk"],
              "popularity": 84,
              "energy": 0.698,
              "danceability": 0.824
            },
            {
              "name": "Mr. Brightside",
              "year": 2004,
              "artists": ["The Killers"],
              "genres": ["rock", "alternative"],
              "popularity": 82,
              "energy": 0.91,
              "danceability": 0.666
            }
          ];
        } else {
          // Classics recommendations
          recommendations = [
            {
              "name": "Bohemian Rhapsody",
              "year": 1975,
              "artists": ["Queen"],
              "genres": ["rock", "progressive rock"],
              "popularity": 89,
              "energy": 0.402,
              "danceability": 0.389
            },
            {
              "name": "Billie Jean",
              "year": 1982,
              "artists": ["Michael Jackson"],
              "genres": ["pop", "disco", "dance"],
              "popularity": 88,
              "energy": 0.769,
              "danceability": 0.736
            },
            {
              "name": "Sweet Child O' Mine",
              "year": 1987,
              "artists": ["Guns N' Roses"],
              "genres": ["rock", "hard rock"],
              "popularity": 87,
              "energy": 0.812,
              "danceability": 0.435
            },
            {
              "name": "Africa",
              "year": 1982,
              "artists": ["Toto"],
              "genres": ["pop rock", "soft rock"],
              "popularity": 84,
              "energy": 0.698,
              "danceability": 0.680
            },
            {
              "name": "Take on Me",
              "year": 1984,
              "artists": ["a-ha"],
              "genres": ["synthpop", "new wave"],
              "popularity": 85,
              "energy": 0.814,
              "danceability": 0.582
            }
          ];
        }
        
        return recommendations;
      };
      
      // Use the first seed song to get recommendations
      const recommendations = getRecommendations(seedSongs[0]);
      
      // Return the recommendations
      return res.json(recommendations);
      
    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
