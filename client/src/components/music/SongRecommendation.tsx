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
import { getRecommendationsFromSong } from "@/lib/musicGen";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { PlayIcon, SearchIcon, RefreshCwIcon } from "lucide-react";
import { MusicIcon } from "lucide-react";

interface SongDetails {
  name: string;
  year: number;
  artists?: string[];
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
      const seedSongs = [{ name: songName, year: songYear }];
      const recommendedSongs = await getRecommendationsFromSong(seedSongs);
      setRecommendations(recommendedSongs);
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Song Recommendation Engine</CardTitle>
          <CardDescription className="text-gray-300">
            Find songs similar to the ones you love
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
                <h3 className="text-xl font-semibold mb-4">Recommended Songs</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((song, index) => (
                    <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{song.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {song.artists ? song.artists.join(", ") : "Unknown Artist"} • {song.year}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between">
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
                          onClick={() => setSongName(song.name)}
                        >
                          <MusicIcon size={16} className="mr-2" />
                          Use as Source
                        </Button>
                      </CardFooter>
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