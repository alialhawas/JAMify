import { useState } from "react";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { MusicGenerator } from "@/components/music/MusicGenerator";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { LoginModal } from "@/components/modals/LoginModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayer } from "@/context/PlayerContext";
import { InfoIcon } from "lucide-react";

export default function Generate() {
  const { isAuthenticated } = useSpotifyOperations();
  const { playerState } = usePlayer();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate Music</h1>
        <p className="text-[#B3B3B3] mb-4">
          Create unique tracks based on your preferences and Spotify data
        </p>
        
        {!isAuthenticated && (
          <Alert className="bg-[#282828] border-[#B3B3B3] rounded-md mb-6">
            <InfoIcon className="text-[#1DB954] mr-3 mt-1 h-5 w-5" />
            <AlertTitle className="font-semibold mb-1">Connect to Spotify</AlertTitle>
            <AlertDescription className="text-[#B3B3B3] text-sm">
              Connect your Spotify account to enhance music generation with your listening preferences.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MusicGenerator />
          
          {playerState.currentTrack && playerState.isGeneratedTrack && (
            <MusicPlayer />
          )}
        </div>
        
        <div>
          <Card className="bg-[#282828] border-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">How It Works</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-[#1DB954] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-[#B3B3B3]">
                    Choose a genre and mood that matches your desired musical style
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#1DB954] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-[#B3B3B3]">
                    Add optional inspiration from your favorite artists
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#1DB954] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-[#B3B3B3]">
                    Set the duration and generate your unique track
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#1DB954] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    4
                  </div>
                  <p className="text-sm text-[#B3B3B3]">
                    Not quite right? Regenerate or create variations until it's perfect
                  </p>
                </div>
              </div>
              
              {!isAuthenticated && (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-[#1DB954] hover:bg-[#1ED760] text-black font-medium py-2 px-4 rounded-full text-sm w-full mt-6 transition duration-300"
                >
                  Connect with Spotify
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </main>
  );
}
