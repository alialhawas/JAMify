import { useSpotify } from "@/context/SpotifyContext";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

// Custom hook for Spotify operations
export function useSpotifyOperations() {
  const { isAuthenticated, accessToken, login, profile, userStats, recommendations } = useSpotify();
  const { toast } = useToast();

  // Function to ensure user is logged in
  const ensureAuthenticated = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Spotify account to use this feature.",
        variant: "destructive"
      });
      
      return false;
    }
    
    return true;
  }, [isAuthenticated, toast]);

  // Function to handle authentication-required operations
  const withAuth = useCallback(
    <T>(operation: () => T): T | undefined => {
      if (ensureAuthenticated()) {
        return operation();
      }
      return undefined;
    },
    [ensureAuthenticated]
  );

  // Get displayable name from profile
  const displayName = profile?.display_name || "Music Lover";
  
  // Check if profile has avatar
  const hasAvatar = Boolean(profile?.images && profile.images.length > 0);
  
  // Get avatar URL if available
  const avatarUrl = hasAvatar ? profile?.images[0]?.url : undefined;

  return {
    isAuthenticated,
    accessToken,
    login,
    profile,
    userStats,
    recommendations,
    ensureAuthenticated,
    withAuth,
    displayName,
    hasAvatar,
    avatarUrl
  };
}
