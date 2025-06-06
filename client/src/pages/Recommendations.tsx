import { useState } from "react";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { LoginModal } from "@/components/modals/LoginModal";
import { RecommendationCard } from "@/components/music/RecommendationCard";
import { SongRecommendation } from "@/components/music/SongRecommendation";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "@/lib/spotify";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Recommendations() {
  const { isAuthenticated, accessToken } = useSpotifyOperations();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("spotify");
  
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: isAuthenticated && !!accessToken,
  });
  
  const handleLoginClick = () => {
    setLoginModalOpen(true);
  };
  
  // Content for when user is not authenticated with Spotify
  const unauthenticatedContent = (
    <div className="mb-10">
      <div className="flex justify-center mb-8">
        <div className="bg-[#282828] p-8 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Connect to Spotify</h2>
          <p className="text-[#B3B3B3] mb-6">
            Connect with Spotify for personalized recommendations based on your listening history.
          </p>
          <button
            onClick={handleLoginClick}
            className="bg-[#1DB954] hover:bg-[#1ED760] text-black font-medium py-3 px-6 rounded-full transition duration-300"
          >
            Connect Spotify Account
          </button>
        </div>
      </div>
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </div>
  );
  
  // Spotify recommendations content
  const spotifyRecommendationsContent = (
    <div className="mt-4">
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#282828] p-4 rounded-md">
              <Skeleton className="w-full aspect-square mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recommendations.map((track) => (
            <RecommendationCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div className="bg-[#282828] p-6 rounded-md text-center">
          <p className="text-[#B3B3B3]">
            No recommendations available. Try listening to more songs on Spotify.
          </p>
        </div>
      )}
    </div>
  );
  
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Music Recommendations</h1>
      <p className="text-[#B3B3B3] mb-6">
        Discover new music based on your preferences
      </p>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="spotify">Spotify Recommendations</TabsTrigger>
          <TabsTrigger value="custom">Song-Based Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spotify" className="mt-0">
          {!isAuthenticated ? unauthenticatedContent : spotifyRecommendationsContent}
        </TabsContent>
        
        <TabsContent value="custom" className="mt-0">
          <SongRecommendation />
        </TabsContent>
      </Tabs>
    </main>
  );
}
