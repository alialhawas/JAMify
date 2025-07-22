import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/ui/audio-player";
import { ExternalLinkIcon, PlayIcon } from "lucide-react";
import { mockTopArtists, mockTopTracks, mockTopGenres } from "./mock-data";

interface MockDisplayProps {
  onConnect: () => void;
}

export function MockTopArtists({ onConnect }: MockDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Top Artists</h2>
        <Button onClick={onConnect} className="bg-green-600 hover:bg-green-700">
          Connect Spotify to See Real Data
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTopArtists.map((artist, index) => (
          <Card key={artist.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 bg-green-600 text-white text-xs"
                  >
                    #{index + 1}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{artist.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400">Popularity:</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {artist.popularity}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {artist.genres.slice(0, 2).map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(artist.external_urls.spotify, '_blank')}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MockTopTracks({ onConnect }: MockDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Top Tracks</h2>
        <Button onClick={onConnect} className="bg-green-600 hover:bg-green-700">
          Connect Spotify to See Real Data
        </Button>
      </div>
      
      <div className="space-y-4">
        {mockTopTracks.map((track) => (
          <Card key={track.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={track.image}
                    alt={track.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 bg-green-600 text-white text-xs"
                  >
                    #{track.rank}
                  </Badge>
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{track.name}</h3>
                    <p className="text-gray-400">{track.artist_name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500">
                        Released: {new Date(track.release_date).getFullYear()}
                      </span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Popularity: {track.popularity}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(track.external_url, '_blank')}
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLinkIcon className="w-4 h-4 mr-1" />
                        View on Spotify
                      </Button>
                    </div>
                  </div>
                  
                  <AudioPlayer
                    src={track.preview_url || null}
                    trackName={track.name}
                    artistName={track.artist_name}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MockTopGenres({ onConnect }: MockDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Music Taste</h2>
        <Button onClick={onConnect} className="bg-green-600 hover:bg-green-700">
          Connect Spotify to See Real Data
        </Button>
      </div>
      
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-gray-300 text-sm mb-4">
              Your listening habits show a diverse taste across multiple genres. Here's what defines your musical preferences:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTopGenres.map((genre, index) => (
                <div key={genre.name} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: genre.color }}
                    />
                    <span className="font-medium text-white">{genre.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${genre.percentage}%`,
                          backgroundColor: genre.color 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 min-w-[3rem]">
                      {genre.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-2">Genre Analysis</h4>
              <p className="text-sm text-gray-300">
                Your top genre is <strong>{mockTopGenres[0].name}</strong> at {mockTopGenres[0].percentage}%, 
                showing you enjoy mainstream and accessible music. The strong presence of 
                <strong> {mockTopGenres[1].name}</strong> ({mockTopGenres[1].percentage}%) and 
                <strong> {mockTopGenres[2].name}</strong> ({mockTopGenres[2].percentage}%) 
                indicates you appreciate both rhythmic and guitar-driven sounds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}