

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpotifyOperations } from "@/hooks/useSpotify";


export default function Stats() {
  const { isAuthenticated,  BACKEND_URL} = useSpotifyOperations();
  const [period, setPeriod] = useState("medium_term");

  const { data: topArtists, isLoading: loadingArtists } = useQuery({
    queryKey: ["top-artists", period],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/top-artists?period=${period}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: topTracks, isLoading: loadingTracks } = useQuery({
    queryKey: ["top-tracks", period],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/top-tracks?period=${period}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: genreStats, isLoading: loadingGenres } = useQuery({
    queryKey: ["top-genres", period],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/top-genres?period=${period}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: isAuthenticated,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Artists */}
      <Card>
        <CardHeader>
          <CardTitle>Top Artists</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingArtists ? (
            <Skeleton className="h-48 w-full" />
          ) : topArtists && Array.isArray(topArtists) ? (
            <ul className="space-y-2">
              {topArtists.map((artist: any, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-sm">{i + 1}.</span>
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm">{artist.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#B3B3B3]">No artist data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top Tracks */}
      <Card>
        <CardHeader>
          <CardTitle>Top Songs</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTracks ? (
            <Skeleton className="h-48 w-full" />
          ) : topTracks && Array.isArray(topTracks) ? (
            <ul className="space-y-2">
              {topTracks.map((track: any, i: number) => (
                <li key={i} className="text-sm">
                  {i + 1}. {track.name} – {track.artist}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#B3B3B3]">No song data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top Genres */}
      <Card>
        <CardHeader>
          <CardTitle>Top Genres</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGenres ? (
            <Skeleton className="h-48 w-full" />
          ) : genreStats?.top_genres?.length > 0 ? (
            <div className="space-y-4">
              {genreStats.top_genres.map(([genre, percentage]: [string, number], i: number) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm capitalize">{genre}</span>
                    <span className="text-sm text-[#B3B3B3]">{percentage}%</span>
                  </div>
                  <div className="h-2 bg-[#121212] rounded-full">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${percentage}%` }}
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

      {/* Genre Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Music Taste Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGenres ? (
            <Skeleton className="h-48 w-full" />
          ) : genreStats?.summary ? (
            <div className="text-sm text-white text-center space-y-2">
              <p className="text-[#B3B3B3]">Genre analysis based on your listening habits</p>
              <p>{genreStats.summary}</p>
            </div>
          ) : (
            <p className="text-[#B3B3B3]">No summary data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


// ----
// import { useSpotifyOperations } from "@/hooks/useSpotify";
// import { LoginModal } from "@/components/modals/LoginModal";
// import { RadarChart } from "@/components/ui/radar-chart";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useQuery } from "@tanstack/react-query";

// import React, { useState, useEffect } from "react";

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";


// export default function Stats() {

//   const [period, setPeriod] = useState("long_term");

//   const { isAuthenticated, accessToken } = useSpotifyOperations();
//   const [loginModalOpen, setLoginModalOpen] = useState(false);
  
//   // Separate API calls for each data type
//   const { data: topArtists, isLoading: loadingArtists, error: artistsError } = useQuery({
//     queryKey: ["/api/top-artists", accessToken],
//     queryFn: async () => {
//       console.log("Fetching top artists from backend with token:", accessToken);
//       const response = await fetch(`${BACKEND_URL}/top-artists?period=${period}`, {
//         credentials: "include", // <== Important for sending cookies!
//       });
//       if (!response.ok) throw new Error(`Top artists request failed: ${response.status}`);
//       const result = await response.json();
//       console.log("Top Artists API Response:", result);
//       return result;
//     },
//     enabled: isAuthenticated,
//   });

//   const { data: topTracks, isLoading: loadingTracks, error: tracksError } = useQuery({
//     queryKey: ["/api/top-tracks", accessToken],
//     queryFn: async () => {
//       console.log("Fetching top tracks from backend with token:", accessToken);
//       const response = await fetch(`${BACKEND_URL}/top-tracks?period=${period}`, {
//         credentials: "include", // <== Important for sending cookies!
//       });
//       if (!response.ok) throw new Error(`Top tracks request failed: ${response.status}`);
//       const result = await response.json();
//       console.log("Top Tracks API Response:", result);
//       return result;
//     },
//     enabled: isAuthenticated,
//   });

//   const { data: genreCount, isLoading: loadingGenres, error: genresError } = useQuery({
//     queryKey: ["/api/genre-count", accessToken],
//     queryFn: async () => {
//       console.log("Fetching genre count from backend with token:", accessToken);
//       const response = await fetch(`${BACKEND_URL}/top-genres?period=${period}`, {
//         credentials: "include", // <== Important for sending cookies!
//       });
//       if (!response.ok) throw new Error(`Genre count request failed: ${response.status}`);
//       const result = await response.json();
//       console.log("Genre Count API Response:", result);
//       return result;
//     },
//     enabled: isAuthenticated,
//   });

//   const isLoading = loadingArtists || loadingTracks || loadingGenres;
//   const error = artistsError || tracksError || genresError;
  
//   const handleLoginClick = () => {
//     setLoginModalOpen(true);
//   };
  
//   if (!isAuthenticated) {
//     return (
//       <main className="p-6">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold mb-2">Your Music Statistics</h1>
//           <p className="text-gray-400">
//             Discover your music taste with detailed analytics from your Spotify listening history
//           </p>
//         </div>

//         <Tabs defaultValue="artists" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-3 bg-gray-800">
//             <TabsTrigger value="artists">Top Artists</TabsTrigger>
//             <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
//             <TabsTrigger value="genres">Music Taste</TabsTrigger>
//           </TabsList>
//           <TabsContent value="artists">
//           {loadingArtists && <p>Loading artists...</p>}
//           {artistsError && <p>Error loading artists: {artistsError.message}</p>}
//           {topArtists && (
//             <TopArtists artists={topArtists} />
//           )}
//         </TabsContent>

//         <TabsContent value="tracks">
//           {loadingTracks && <p>Loading tracks...</p>}
//           {tracksError && <p>Error loading tracks: {tracksError.message}</p>}
//           {topTracks && (
//             <TopTracks tracks={topTracks} />
//           )}
//         </TabsContent>

//         <TabsContent value="genres">
//           {loadingGenres && <p>Loading genres...</p>}
//           {genresError && <p>Error loading genres: {genresError.message}</p>}
//           {genreCount && (
//             <TopGenres genres={genreCount} />
//           )}
//         </TabsContent>
//         </Tabs>
        
//         <LoginModal 
//           isOpen={loginModalOpen} 
//           onClose={() => setLoginModalOpen(false)} 
//         />
//       </main>
//     );
//   }
  
//   return (
//     <main className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Your Listening Stats</h1>
//       </div>
      
//       {/* Debug Info */}
//       {error && (
//         <div className="bg-red-500/20 border border-red-500 p-4 rounded-md mb-6">
//           <p className="text-red-400">API Error: {error.message}</p>
//         </div>
//       )}
      
//       {/* API Response Debug */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//         {topArtists && (
//           <div className="bg-blue-500/20 border border-blue-500 p-4 rounded-md">
//             <p className="text-blue-400">Top Artists API Response:</p>
//             <pre className="text-sm text-blue-300 mt-2 overflow-x-auto">
//               {JSON.stringify(topArtists, null, 2)}
//             </pre>
//           </div>
//         )}
        
//         {topTracks && (
//           <div className="bg-green-500/20 border border-green-500 p-4 rounded-md">
//             <p className="text-green-400">Top Tracks API Response:</p>
//             <pre className="text-sm text-green-300 mt-2 overflow-x-auto">
//               {JSON.stringify(topTracks, null, 2)}
//             </pre>
//           </div>
//         )}
        
//         {genreCount && (
//           <div className="bg-purple-500/20 border border-purple-500 p-4 rounded-md">
//             <p className="text-purple-400">Genre Count API Response:</p>
//             <pre className="text-sm text-purple-300 mt-2 overflow-x-auto">
//               {JSON.stringify(genreCount, null, 2)}
//             </pre>
//           </div>
//         )}
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Top Genres */}
//         <Card className="bg-[#282828] border-none">
//           <CardHeader className="pb-2">
//             <CardTitle className="font-semibold text-lg">Top Genres</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div className="space-y-4">
//                 {[1, 2, 3, 4].map((i) => (
//                   <div key={i}>
//                     <div className="flex justify-between mb-1">
//                       <Skeleton className="h-4 w-20" />
//                       <Skeleton className="h-4 w-10" />
//                     </div>
//                     <Skeleton className="h-2 w-full" />
//                   </div>
//                 ))}
//               </div>
//             ) : genreCount && Array.isArray(genreCount) && genreCount.length > 0 ? (
//               <div className="space-y-4">
//                 {genreCount.map((genre, index) => (
//                   <div key={genre.genre || index}>
//                     <div className="flex justify-between mb-1">
//                       <span className="text-sm">{genre.genre || 'Unknown Genre'}</span>
//                       <span className="text-sm text-[#B3B3B3]">{genre.count || 0}</span>
//                     </div>
//                     <div className="h-2 bg-[#121212] rounded-full">
//                       <div 
//                         className="h-full rounded-full bg-green-500" 
//                         style={{ 
//                           width: `${Math.min(100, (genre.count || 0) * 10)}%`
//                         }}
//                       ></div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-[#B3B3B3]">No genre data available</p>
//             )}
//           </CardContent>
//         </Card>
        
//         {/* Mood Analysis */}
//         <Card className="bg-[#282828] border-none">
//           <CardHeader className="pb-2">
//             <CardTitle className="font-semibold text-lg">Music Mood Analysis</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div className="flex items-center justify-center h-48">
//                 <Skeleton className="h-40 w-40 rounded-full" />
//               </div>
//             ) : stats?.moodAnalysis ? (
//               <div className="relative h-48">
//                 <RadarChart data={stats.moodAnalysis} />
//               </div>
//             ) : (
//               <p className="text-[#B3B3B3]">No mood data available</p>
//             )}
//           </CardContent>
//         </Card>
        
//         {/* Top Artists */}
//         <Card className="bg-[#282828] border-none">
//           <CardHeader className="pb-2">
//             <CardTitle className="font-semibold text-lg">Top Artists</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div className="space-y-3">
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} className="flex items-center">
//                     <Skeleton className="w-10 h-10 rounded-full mr-3" />
//                     <div className="flex-grow">
//                       <div className="flex justify-between">
//                         <Skeleton className="h-4 w-24" />
//                         <Skeleton className="h-4 w-16" />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : topArtists && Array.isArray(topArtists) && topArtists.length > 0 ? (
//               <div className="space-y-3">
//                 {topArtists.slice(0, 5).map((artist, index) => (
//                   <div key={artist.id || index} className="flex items-center">
//                     <div className="w-10 h-10 rounded-full bg-gray-600 mr-3 flex items-center justify-center">
//                       {artist.images && artist.images.length > 0 ? (
//                         <img 
//                           src={artist.images[0].url} 
//                           alt={artist.name} 
//                           className="w-10 h-10 rounded-full object-cover"
//                         />
//                       ) : (
//                         <span className="text-xs">🎵</span>
//                       )}
//                     </div>
//                     <div className="flex-grow">
//                       <div className="flex justify-between">
//                         <span className="text-sm font-medium">{artist.name}</span>
//                         <span className="text-sm text-[#B3B3B3]">
//                           {artist.popularity || 0}% popularity
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-[#B3B3B3]">No artist data available</p>
//             )}
//           </CardContent>
//         </Card>
        
//         {/* Top Tracks */}
//         <Card className="bg-[#282828] border-none">
//           <CardHeader className="pb-2">
//             <CardTitle className="font-semibold text-lg">Top Tracks</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div className="space-y-3">
//                 {[1, 2, 3, 4, 5].map((i) => (
//                   <div key={i} className="flex items-center">
//                     <Skeleton className="w-12 h-12 rounded mr-3" />
//                     <div className="flex-grow">
//                       <Skeleton className="h-4 w-32 mb-1" />
//                       <Skeleton className="h-3 w-24" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : topTracks && Array.isArray(topTracks) && topTracks.length > 0 ? (
//               <div className="space-y-3">
//                 {topTracks.slice(0, 5).map((track, index) => (
//                   <div key={track.id || index} className="flex items-center">
//                     <div className="w-12 h-12 rounded bg-gray-600 mr-3 flex items-center justify-center">
//                       {track.album?.images && track.album.images.length > 0 ? (
//                         <img 
//                           src={track.album.images[0].url} 
//                           alt={track.album.name} 
//                           className="w-12 h-12 rounded object-cover"
//                         />
//                       ) : (
//                         <span className="text-xs">🎵</span>
//                       )}
//                     </div>
//                     <div className="flex-grow">
//                       <div className="text-sm font-medium">{track.name}</div>
//                       <div className="text-xs text-[#B3B3B3]">
//                         {track.artists?.map(artist => artist.name).join(', ')}
//                       </div>
//                       <div className="text-xs text-[#B3B3B3]">
//                         Popularity: {track.popularity || 0}%
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-[#B3B3B3]">No track data available</p>
//             )}
//           </CardContent>
//         </Card>
        
//         {/* Music Taste Analysis */}
//         <Card className="bg-[#282828] border-none">
//           <CardHeader className="pb-2">
//             <CardTitle className="font-semibold text-lg">Music Taste Analysis</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <Skeleton className="h-48 w-full" />
//             ) : genreCount ? (
//               <div className="text-center">
//                 <p className="text-[#B3B3B3]">Genre analysis based on your listening habits</p>
//                 <div className="mt-4 text-sm">
//                   <p>Total genres in your library: {Array.isArray(genreCount) ? genreCount.length : 0}</p>
//                 </div>
//               </div>
//             ) : (
//               <p className="text-[#B3B3B3]">No music taste data available</p>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </main>
//   );
// }


// import React, { useEffect, useState } from "react";

// const timeRanges = [
//   { label: "Last 4 weeks", value: "short_term" },
//   { label: "Last 6 months", value: "medium_term" },
//   { label: "All time", value: "long_term" },
// ];

// export default function Stats() {
//   const [period, setPeriod] = useState("short_term");
//   const [topArtists, setTopArtists] = useState([]);
//   const [topTracks, setTopTracks] = useState([]);
//   const [topGenres, setTopGenres] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchData();
//   }, [period]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [artistsRes, tracksRes, genresRes] = await Promise.all([
//         fetch(`http://localhost:8000/top-artists?period=${period}`, {
//           credentials: "include", 
//         }),
//         fetch(`http://localhost:8000/top-tracks?period=${period}`, {
//           credentials: "include",
//         }),
//         fetch(`http://localhost:8000/top-genres?period=${period}`, {
//           credentials: "include",
//         }),
//       ]);

//       const [artistsJson, tracksJson, genresJson] = await Promise.all([
//         artistsRes.json(),
//         tracksRes.json(),
//         genresRes.json(),
//       ]);

//       setTopArtists(artistsJson["top-artiest"] || []);
//       setTopTracks(tracksJson["top-tracks"] || []);
//       setTopGenres(genresJson["top-genres"] || []);
//     } catch (err) {
//       console.error("Failed to fetch stats:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h1 className="text-3xl font-bold mb-4">Your Spotify Stats</h1>

//       <div className="mb-6">
//         <label className="mr-2 font-medium">Time range:</label>
//         <select
//           value={period}
//           onChange={(e) => setPeriod(e.target.value)}
//           className="border rounded px-2 py-1"
//         >
//           {timeRanges.map((t) => (
//             <option key={t.value} value={t.value}>
//               {t.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           {/* Top Artists */}
//           <section className="mb-10">
//             <h2 className="text-2xl font-semibold mb-2">Top Artists</h2>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {topArtists.map((artist, i) => (
//                 <div key={i} className="p-3 border rounded shadow">
//                   <img src={artist.image} alt={artist.name} className="w-full rounded mb-2" />
//                   <p className="font-medium">{artist.name}</p>
//                   <p className="text-sm text-gray-500">Rank #{artist.rank}</p>
//                 </div>
//               ))}
//             </div>
//           </section>

//           {/* Top Tracks */}
//           <section className="mb-10">
//             <h2 className="text-2xl font-semibold mb-2">Top Tracks</h2>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {topTracks.map((track, i) => (
//                 <div key={i} className="p-3 border rounded shadow">
//                   <img src={track.image1 || track.image2 || track.image3} alt={track.song_name} className="w-full rounded mb-2" />
//                   <p className="font-medium">{track.song_name}</p>
//                   <p className="text-sm text-gray-500">{track.artist_name}</p>
//                 </div>
//               ))}
//             </div>
//           </section>

//           {/* Top Genres */}
//           <section>
//             <h2 className="text-2xl font-semibold mb-2">Top Genres</h2>
//             <ul className="list-disc ml-6">
//               {topGenres.map((genre, i) => (
//                 <li key={i}>
//                   {genre.name}: {genre.count}
//                 </li>
//               ))}
//             </ul>
//           </section>
//         </>
//       )}
//     </div>
//   );
// }
