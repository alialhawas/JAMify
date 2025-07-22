import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getJamifyRecommendations } from "@/lib/jamifyApi";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { 
  PlayIcon, 
  SearchIcon, 
  RefreshCwIcon, 
  MusicIcon,
  BarChart4Icon,
  HeartIcon
} from "lucide-react";

interface SongDetails {
  name: string;
  year: number;
  artists?: string[];
  genres?: string[];
  popularity?: number;
  energy?: number;
  danceability?: number;
}

export function SongRecommendation() {
  const [songName, setSongName] = useState("");
  const [songYear, setSongYear] = useState<number>(new Date().getFullYear());
  const [recommendations, setRecommendations] = useState<SongDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!songName || !songYear) {
      setError("Please enter both a song name and year");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getJamifyRecommendations({
        songs: [{ name: songName, year: songYear }],
        n_songs: 5
      });
      
      setRecommendations(data.recommendations.map(rec => ({
        ...rec,
        artists: Array.isArray(rec.artists) ? rec.artists : [rec.artists]
      })));
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render a meter for audio features
  const renderFeatureMeter = (value: number | undefined, label: string) => {
    if (typeof value === 'undefined') return null;
    
    const percentage = Math.round(value * 100);
    let bgColor = 'bg-blue-500';
    
    if (label === 'Energy') {
      bgColor = 'bg-red-500';
    } else if (label === 'Danceability') {
      bgColor = 'bg-purple-500';
    }
    
    return (
      <div className="mb-1">
        <div className="flex justify-between text-xs mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`${bgColor} h-2 rounded-full`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Song Recommendation Engine</CardTitle>
          <CardDescription className="text-gray-300">
            Find songs similar to the ones you love based on audio features and characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="song-name" className="text-gray-200">Song Name</Label>
                <Input
                  id="song-name"
                  placeholder="Enter a song name (e.g., Shape of You)"
                  className="bg-gray-800 border-gray-700 text-white"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="song-year" className="text-gray-200">Year</Label>
                <Input
                  id="song-year"
                  type="number"
                  placeholder="Year"
                  className="bg-gray-800 border-gray-700 text-white"
                  value={songYear}
                  onChange={(e) => setSongYear(parseInt(e.target.value) || new Date().getFullYear())}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            
            {error && (
              <div className="text-red-300 text-sm">{error}</div>
            )}
            
            <SpotifyButton
              onClick={handleRecommend}
              disabled={isLoading}
              icon={isLoading ? <RefreshCwIcon className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            >
              {isLoading ? "Finding recommendations..." : "Get Recommendations"}
            </SpotifyButton>
          </div>
          
          {recommendations.length > 0 && (
            <>
              <Separator className="my-6 bg-gray-700" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Recommended Songs</h3>
                  <Badge variant="outline" className="bg-gray-800/50">
                    Based on {songName} ({songYear})
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {recommendations.map((song, index) => (
                    <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-700/80 transition-colors overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 p-4 bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col justify-between">
                          <div>
                            <CardTitle className="text-xl mb-1">{song.name}</CardTitle>
                            <CardDescription className="text-gray-300 mb-3">
                              {song.artists ? (Array.isArray(song.artists) ? song.artists.join(", ") : song.artists) : "Unknown Artist"} • {song.year}
                            </CardDescription>
                            
                            {song.genres && song.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {song.genres.map((genre, i) => (
                                  <Badge key={i} className="bg-gray-600/50 hover:bg-gray-600">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-400 hover:bg-green-900/20"
                            >
                              <PlayIcon size={16} className="mr-2" />
                              Play
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-400 hover:bg-blue-900/20"
                              onClick={() => {
                                setSongName(song.name);
                                setSongYear(song.year);
                              }}
                            >
                              <MusicIcon size={16} className="mr-2" />
                              Use as Source
                            </Button>
                          </div>
                        </div>
                        
                        <div className="md:w-2/3 p-4">
                          <div className="flex items-center mb-3">
                            {song.popularity !== undefined && (
                              <div className="flex items-center text-yellow-400 mr-4">
                                <BarChart4Icon size={18} className="mr-1" />
                                <span>Popularity: {song.popularity}/100</span>
                              </div>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-auto text-red-400 hover:bg-red-900/20"
                            >
                              <HeartIcon size={16} className="mr-2" />
                              Save
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {renderFeatureMeter(song.energy, 'Energy')}
                            {renderFeatureMeter(song.danceability, 'Danceability')}
                          </div>
                          
                          <p className="text-sm text-gray-400 mt-3">
                            This song was recommended based on audio feature similarity and genre matching.
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}