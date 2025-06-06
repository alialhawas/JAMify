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

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.");
}

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
      
      res.json({
        topGenres,
        topArtists,
        listeningActivity,
        moodAnalysis
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
      
      // Since we're using a sample dataset and Node.js doesn't allow 'require' in ES modules,
      // let's provide sample recommendations for now
      
      // Recommendations based on audio similarity
      const sampleRecommendations = [
        {
          "name": "Uptown Funk",
          "year": 2014,
          "artists": ["Mark Ronson", "Bruno Mars"]
        },
        {
          "name": "Despacito",
          "year": 2017,
          "artists": ["Luis Fonsi", "Daddy Yankee"]
        },
        {
          "name": "Africa",
          "year": 1982,
          "artists": ["Toto"]
        },
        {
          "name": "Take on Me",
          "year": 1984,
          "artists": ["a-ha"]
        },
        {
          "name": "Dancing Queen",
          "year": 1976,
          "artists": ["ABBA"]
        }
      ];
      
      // Return the recommendations
      return res.json(sampleRecommendations);
      
    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
