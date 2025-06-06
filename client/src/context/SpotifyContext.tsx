import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { SpotifyProfile, UserStats, RecommendedTrack } from "@/types";
import { getAccessTokenFromUrl, getUserProfile, refreshAccessToken, getUserStats, getRecommendations } from "@/lib/spotify";
import { useToast } from "@/hooks/use-toast";

interface SpotifyContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  profile: SpotifyProfile | null;
  userStats: UserStats | null;
  recommendations: RecommendedTrack[] | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshStats: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("spotify_access_token"));
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedTrack[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Check for access token in URL (after Spotify redirect)
  useEffect(() => {
    const { accessToken: urlToken, expiresIn } = getAccessTokenFromUrl();
    
    if (urlToken) {
      localStorage.setItem("spotify_access_token", urlToken);
      
      if (expiresIn) {
        const expiryTime = new Date();
        expiryTime.setSeconds(expiryTime.getSeconds() + expiresIn);
        localStorage.setItem("spotify_token_expiry", expiryTime.toISOString());
      }
      
      setAccessToken(urlToken);
    }
  }, []);

  // Load user profile when access token changes
  useEffect(() => {
    if (accessToken) {
      loadUserProfile();
    }
  }, [accessToken]);

  const loadUserProfile = async () => {
    if (!accessToken) return;
    
    setIsLoading(true);
    try {
      const userData = await getUserProfile(accessToken);
      setProfile(userData);
      
      // Load user stats and recommendations
      await Promise.all([
        loadUserStats(),
        loadRecommendations()
      ]);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to load your Spotify profile. Please try logging in again.",
        variant: "destructive"
      });
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!accessToken) return;
    
    try {
      const stats = await getUserStats(accessToken);
      setUserStats(stats);
    } catch (error) {
      console.error("Failed to load user stats:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load your listening statistics.",
        variant: "destructive"
      });
    }
  };

  const loadRecommendations = async () => {
    if (!accessToken) return;
    
    try {
      const recs = await getRecommendations(accessToken);
      setRecommendations(recs);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load your music recommendations.",
        variant: "destructive"
      });
    }
  };

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_token_expiry");
    setAccessToken(null);
    setProfile(null);
    setUserStats(null);
    setRecommendations(null);
  };

  const refreshStats = async () => {
    await loadUserStats();
  };

  const refreshRecommendations = async () => {
    await loadRecommendations();
  };

  const value = {
    isAuthenticated: !!accessToken,
    accessToken,
    profile,
    userStats,
    recommendations,
    isLoading,
    login,
    logout,
    refreshStats,
    refreshRecommendations
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return context;
}
