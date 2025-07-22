import { useState, useEffect } from "react";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { LoginModal } from "@/components/modals/LoginModal";
import { ArtistItem } from "@/components/ui/artist-item";
import { RadarChart } from "@/components/ui/radar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserStats } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getUserStats } from "@/lib/spotify";

export default function Stats() {
  const { isAuthenticated, accessToken } = useSpotifyOperations();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  // Separate API calls for each data type
  const { data: topArtists, isLoading: loadingArtists, error: artistsError } = useQuery({
    queryKey: ["/api/top-artists", accessToken],
    queryFn: async () => {
      console.log("Fetching top artists from backend with token:", accessToken);
      const response = await fetch(`https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/top-artists?user_id=user123`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error(`Top artists request failed: ${response.status}`);
      const result = await response.json();
      console.log("Top Artists API Response:", result);
      return result;
    },
    enabled: isAuthenticated && !!accessToken,
  });

  const { data: topTracks, isLoading: loadingTracks, error: tracksError } = useQuery({
    queryKey: ["/api/top-tracks", accessToken],
    queryFn: async () => {
      console.log("Fetching top tracks from backend with token:", accessToken);
      const response = await fetch(`https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/top-tracks?user_id=user123`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error(`Top tracks request failed: ${response.status}`);
      const result = await response.json();
      console.log("Top Tracks API Response:", result);
      return result;
    },
    enabled: isAuthenticated && !!accessToken,
  });

  const { data: genreCount, isLoading: loadingGenres, error: genresError } = useQuery({
    queryKey: ["/api/genre-count", accessToken],
    queryFn: async () => {
      console.log("Fetching genre count from backend with token:", accessToken);
      const response = await fetch(`https://1d1a4873-308d-439a-a5df-124dd6f9e6ce-00-123kw0oztqvdu.picard.replit.dev:8000/genre-count?user_id=user123`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error(`Genre count request failed: ${response.status}`);
      const result = await response.json();
      console.log("Genre Count API Response:", result);
      return result;
    },
    enabled: isAuthenticated && !!accessToken,
  });

  const isLoading = loadingArtists || loadingTracks || loadingGenres;
  const error = artistsError || tracksError || genresError;
  
  const handleLoginClick = () => {
    setLoginModalOpen(true);
  };
  
  if (!isAuthenticated) {
    return (
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Music Statistics</h1>
          <p className="text-gray-400">
            Discover your music taste with detailed analytics from your Spotify listening history
          </p>
        </div>

        <Tabs defaultValue="artists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="artists">Top Artists</TabsTrigger>
            <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
            <TabsTrigger value="genres">Music Taste</TabsTrigger>
          </TabsList>
          <TabsContent value="artists">
          {loadingArtists && <p>Loading artists...</p>}
          {artistsError && <p>Error loading artists: {artistsError.message}</p>}
          {topArtists && (
            <TopArtists artists={topArtists} />
          )}
        </TabsContent>

        <TabsContent value="tracks">
          {loadingTracks && <p>Loading tracks...</p>}
          {tracksError && <p>Error loading tracks: {tracksError.message}</p>}
          {topTracks && (
            <TopTracks tracks={topTracks} />
          )}
        </TabsContent>

        <TabsContent value="genres">
          {loadingGenres && <p>Loading genres...</p>}
          {genresError && <p>Error loading genres: {genresError.message}</p>}
          {genreCount && (
            <TopGenres genres={genreCount} />
          )}
        </TabsContent>
        </Tabs>
        
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
      
      {/* Debug Info */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-md mb-6">
          <p className="text-red-400">API Error: {error.message}</p>
        </div>
      )}
      
      {/* API Response Debug */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {topArtists && (
          <div className="bg-blue-500/20 border border-blue-500 p-4 rounded-md">
            <p className="text-blue-400">Top Artists API Response:</p>
            <pre className="text-sm text-blue-300 mt-2 overflow-x-auto">
              {JSON.stringify(topArtists, null, 2)}
            </pre>
          </div>
        )}
        
        {topTracks && (
          <div className="bg-green-500/20 border border-green-500 p-4 rounded-md">
            <p className="text-green-400">Top Tracks API Response:</p>
            <pre className="text-sm text-green-300 mt-2 overflow-x-auto">
              {JSON.stringify(topTracks, null, 2)}
            </pre>
          </div>
        )}
        
        {genreCount && (
          <div className="bg-purple-500/20 border border-purple-500 p-4 rounded-md">
            <p className="text-purple-400">Genre Count API Response:</p>
            <pre className="text-sm text-purple-300 mt-2 overflow-x-auto">
              {JSON.stringify(genreCount, null, 2)}
            </pre>
          </div>
        )}
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
            ) : genreCount && Array.isArray(genreCount) && genreCount.length > 0 ? (
              <div className="space-y-4">
                {genreCount.map((genre, index) => (
                  <div key={genre.genre || index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{genre.genre || 'Unknown Genre'}</span>
                      <span className="text-sm text-[#B3B3B3]">{genre.count || 0}</span>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full">
                      <div 
                        className="h-full rounded-full bg-green-500" 
                        style={{ 
                          width: `${Math.min(100, (genre.count || 0) * 10)}%`
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
            ) : topArtists && Array.isArray(topArtists) && topArtists.length > 0 ? (
              <div className="space-y-3">
                {topArtists.slice(0, 5).map((artist, index) => (
                  <div key={artist.id || index} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-600 mr-3 flex items-center justify-center">
                      {artist.images && artist.images.length > 0 ? (
                        <img 
                          src={artist.images[0].url} 
                          alt={artist.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs">🎵</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{artist.name}</span>
                        <span className="text-sm text-[#B3B3B3]">
                          {artist.popularity || 0}% popularity
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No artist data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Top Tracks */}
        <Card className="bg-[#282828] border-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-lg">Top Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="w-12 h-12 rounded mr-3" />
                    <div className="flex-grow">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topTracks && Array.isArray(topTracks) && topTracks.length > 0 ? (
              <div className="space-y-3">
                {topTracks.slice(0, 5).map((track, index) => (
                  <div key={track.id || index} className="flex items-center">
                    <div className="w-12 h-12 rounded bg-gray-600 mr-3 flex items-center justify-center">
                      {track.album?.images && track.album.images.length > 0 ? (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.album.name} 
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <span className="text-xs">🎵</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm font-medium">{track.name}</div>
                      <div className="text-xs text-[#B3B3B3]">
                        {track.artists?.map(artist => artist.name).join(', ')}
                      </div>
                      <div className="text-xs text-[#B3B3B3]">
                        Popularity: {track.popularity || 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No track data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Music Taste Analysis */}
        <Card className="bg-[#282828] border-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold text-lg">Music Taste Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : genreCount ? (
              <div className="text-center">
                <p className="text-[#B3B3B3]">Genre analysis based on your listening habits</p>
                <div className="mt-4 text-sm">
                  <p>Total genres in your library: {Array.isArray(genreCount) ? genreCount.length : 0}</p>
                </div>
              </div>
            ) : (
              <p className="text-[#B3B3B3]">No music taste data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
