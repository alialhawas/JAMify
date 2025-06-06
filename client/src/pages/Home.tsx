import { useState } from "react";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { LoginModal } from "@/components/modals/LoginModal";
import { MusicGenerator } from "@/components/music/MusicGenerator";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { RecommendationCard } from "@/components/music/RecommendationCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePlayer } from "@/context/PlayerContext";
import { InfoIcon } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, login, recommendations } = useSpotifyOperations();
  const { playerState } = usePlayer();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  const handleConnect = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
    }
  };
  
  return (
    <main className="p-6">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Create Your Own Music</h1>
        <p className="text-[#B3B3B3] mb-6">
          Generate unique tracks based on your Spotify listening habits
        </p>
        
        {!isAuthenticated && (
          <Alert className="bg-[#282828] border-[#B3B3B3] rounded-md mb-8">
            <InfoIcon className="text-[#1DB954] mr-3 mt-1 h-5 w-5" />
            <AlertTitle className="font-semibold mb-1">Connect to Spotify</AlertTitle>
            <AlertDescription className="text-[#B3B3B3] text-sm">
              Connect your Spotify account to unlock personalized music generation and recommendations.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Music Generation Module */}
      <div className="mb-12">
        <MusicGenerator />
        
        {playerState.currentTrack && playerState.isGeneratedTrack && (
          <MusicPlayer />
        )}
      </div>
      
      {/* Recommendations Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recommended For You</h2>
          <Link href="/recommendations">
            <a className="text-[#1DB954] text-sm font-medium hover:underline">
              View All
            </a>
          </Link>
        </div>
        
        {isAuthenticated && recommendations ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((track) => (
              <RecommendationCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <div className="bg-[#282828] p-6 rounded-md text-center">
            <p className="text-[#B3B3B3] mb-4">
              Connect your Spotify account to see personalized recommendations
            </p>
            <button
              onClick={handleConnect}
              className="bg-[#1DB954] hover:bg-[#1ED760] text-black font-medium py-2 px-4 rounded-full text-sm transition duration-300"
            >
              Connect Spotify
            </button>
          </div>
        )}
      </div>
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </main>
  );
}
