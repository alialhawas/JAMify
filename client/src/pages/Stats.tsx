import { useState, useEffect } from "react";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { LoginModal } from "@/components/modals/LoginModal";
import { ArtistItem } from "@/components/ui/artist-item";
import { RadarChart } from "@/components/ui/radar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserStats } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getUserStats } from "@/lib/spotify";

export default function Stats() {
  const { isAuthenticated, accessToken } = useSpotifyOperations();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated && !!accessToken,
  });
  
  const handleLoginClick = () => {
    setLoginModalOpen(true);
  };
  
  if (!isAuthenticated) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">Your Listening Stats</h1>
        <p className="text-[#B3B3B3] mb-6">
          Connect with Spotify to see your personalized listening statistics.
        </p>
        
        <div className="flex justify-center">
          <div className="bg-[#282828] p-8 rounded-xl max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Connect to Spotify</h2>
            <p className="text-[#B3B3B3] mb-6">
              We need access to your Spotify data to generate your listening stats and music insights.
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
      </main>
    );
  }
  
  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Listening Stats</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Genres */}
        <Card className="bg-[#282828] border-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-lg">Top Genres</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : stats?.topGenres ? (
              <div className="space-y-4">
                {stats.topGenres.map((genre) => (
                  <div key={genre.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{genre.name}</span>
                      <span className="text-sm text-[#B3B3B3]">{genre.percentage}%</span>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${genre.percentage}%`,
                          backgroundColor: genre.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No genre data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Mood Analysis */}
        <Card className="bg-[#282828] border-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-lg">Music Mood Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : stats?.moodAnalysis ? (
              <div className="relative h-48">
                <RadarChart data={stats.moodAnalysis} />
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No mood data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Top Artists */}
        <Card className="bg-[#282828] border-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-lg">Top Artists</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.topArtists ? (
              <div className="space-y-3">
                {stats.topArtists.map((artist) => (
                  <ArtistItem
                    key={artist.id}
                    name={artist.name}
                    imageUrl={artist.imageUrl}
                    playCount={artist.playCount}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No artist data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Listening Activity */}
        <Card className="bg-[#282828] border-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-lg">Listening Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : stats?.listeningActivity ? (
              <div className="h-48">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                  {/* Chart grid */}
                  <line x1="0" y1="0" x2="300" y2="0" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="25" x2="300" y2="25" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#333" strokeWidth="1" />
                  
                  {/* Chart data */}
                  <path 
                    d={`M${stats.listeningActivity.map((item, i) => {
                      const x = (i / (stats.listeningActivity.length - 1)) * 300;
                      const y = 100 - (item.count / 100) * 100;
                      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                    }).join(' ')}`} 
                    fill="none" 
                    stroke="#1DB954" 
                    strokeWidth="2" 
                  />
                  
                  <path 
                    d={`M0,${100 - (stats.listeningActivity[0].count / 100) * 100} ${stats.listeningActivity.map((item, i) => {
                      const x = (i / (stats.listeningActivity.length - 1)) * 300;
                      const y = 100 - (item.count / 100) * 100;
                      return `L${x},${y}`;
                    }).join(' ')} L300,100 L0,100 Z`} 
                    fill="url(#gradient)" 
                    stroke="none" 
                    opacity="0.3" 
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1DB954" />
                      <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* X-axis labels */}
                  {stats.listeningActivity.map((item, i) => (
                    <text 
                      key={i}
                      x={(i / (stats.listeningActivity.length - 1)) * 300} 
                      y="115" 
                      fill="#B3B3B3" 
                      fontSize="8" 
                      textAnchor="middle"
                    >
                      {item.day}
                    </text>
                  ))}
                </svg>
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No activity data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
