import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/ui/audio-player";
import { CalendarIcon, ClockIcon, MusicIcon, SparklesIcon, TrendingUpIcon } from "lucide-react";

interface ChartTopper {
  id: string;
  name: string;
  artist: string;
  year: number;
  genre: string;
  image: string;
  chartPosition: number;
  weeksAtNumber1: number;
  preview_url: string | null;
  significance: string;
}

interface YearData {
  year: number;
  description: string;
  color: string;
  culturalContext: string;
  hits: ChartTopper[];
}

export default function TimeMachine() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedYearData, setSelectedYearData] = useState<YearData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNostalgicHits = () => {
    if (!selectedYear || parseInt(selectedYear) < 1980 || parseInt(selectedYear) > 2020) {
      alert("Please enter a valid year between 1980 and 2020");
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const year = parseInt(selectedYear);
      const yearData = getHitsForYear(year);
      setSelectedYearData(yearData);
      setIsGenerating(false);
    }, 2000);
  };

  const getHitsForYear = (year: number): YearData => {
    if (year >= 1980 && year <= 1989) {
      return {
        year: year,
        description: "The decade of MTV, synthesizers, and iconic pop anthems",
        color: "#FF6B9D",
        culturalContext: "The 80s brought us music television, the rise of the pop superstar, and unforgettable chart-topping hits that still make us nostalgic today.",
        hits: [
          {
            id: "1",
            name: "Billie Jean",
            artist: "Michael Jackson",
            year: 1983,
            genre: "Pop",
            image: "https://i.scdn.co/image/ab67616d0000b273de0cd11d7b31c3bd1fd5983d",
            chartPosition: 1,
            weeksAtNumber1: 7,
            preview_url: null,
            significance: "King of Pop's masterpiece that dominated charts worldwide"
          },
          {
            id: "2",
            name: "Like a Virgin",
            artist: "Madonna",
            year: 1984,
            genre: "Pop",
            image: "https://i.scdn.co/image/ab67616d0000b273bf5115577fe13ddf3ec18b85",
            chartPosition: 1,
            weeksAtNumber1: 6,
            preview_url: null,
            significance: "Launched the Material Girl era and redefined pop stardom"
          },
          {
            id: "3",
            name: "Sweet Child O' Mine",
            artist: "Guns N' Roses",
            year: 1988,
            genre: "Rock",
            image: "https://i.scdn.co/image/ab67616d0000b273628d506d5bdbe0a0a2c6d1fe",
            chartPosition: 1,
            weeksAtNumber1: 2,
            preview_url: null,
            significance: "Rock anthem with the most recognizable guitar riff of the decade"
          }
        ]
      };
    } else if (year >= 1990 && year <= 1999) {
      return {
        year: year,
        description: "Grunge, alternative rock, and the birth of modern pop",
        color: "#4ECDC4",
        culturalContext: "The 90s revolutionized music with grunge, hip-hop's golden age, and the emergence of teen pop that would dominate the charts.",
        hits: [
          {
            id: "4",
            name: "Smells Like Teen Spirit",
            artist: "Nirvana",
            year: 1991,
            genre: "Grunge",
            image: "https://i.scdn.co/image/ab67616d0000b273bc711e5f8fa4ecc3b18ae2ce",
            chartPosition: 6,
            weeksAtNumber1: 0,
            preview_url: null,
            significance: "Grunge anthem that defined Generation X and changed rock forever"
          },
          {
            id: "5",
            name: "Wonderwall",
            artist: "Oasis",
            year: 1995,
            genre: "Britpop",
            image: "https://i.scdn.co/image/ab67616d0000b2737228e6ba5f9d987235562ffd",
            chartPosition: 8,
            weeksAtNumber1: 0,
            preview_url: null,
            significance: "Britpop masterpiece that became a generational singalong anthem"
          },
          {
            id: "6",
            name: "...Baby One More Time",
            artist: "Britney Spears",
            year: 1998,
            genre: "Pop",
            image: "https://i.scdn.co/image/ab67616d0000b273dbb3dd82da45b7d7f31b1b42",
            chartPosition: 1,
            weeksAtNumber1: 2,
            preview_url: null,
            significance: "Teen pop explosion that launched the pop princess era"
          }
        ]
      };
    } else if (year >= 2000 && year <= 2009) {
      return {
        year: year,
        description: "Digital music revolution and hip-hop dominance",
        color: "#45B7D1",
        culturalContext: "The 2000s saw the rise of digital music, reality TV stars turned pop icons, and hip-hop becoming the dominant force in popular culture.",
        hits: [
          {
            id: "7",
            name: "Crazy",
            artist: "Gnarls Barkley",
            year: 2006,
            genre: "Alternative",
            image: "https://i.scdn.co/image/ab67616d0000b273c9b6c0c4fb22e1b2c5f4b4e4",
            chartPosition: 1,
            weeksAtNumber1: 9,
            preview_url: null,
            significance: "First song to reach #1 based on downloads alone in the UK"
          },
          {
            id: "8",
            name: "Hey Ya!",
            artist: "OutKast",
            year: 2003,
            genre: "Hip Hop",
            image: "https://i.scdn.co/image/ab67616d0000b273f5b90b6d7bb0e7e4c7c4f2c3",
            chartPosition: 1,
            weeksAtNumber1: 9,
            preview_url: null,
            significance: "Hip-hop crossover hit that dominated charts and dance floors"
          },
          {
            id: "9",
            name: "Umbrella",
            artist: "Rihanna ft. Jay-Z",
            year: 2007,
            genre: "Pop/R&B",
            image: "https://i.scdn.co/image/ab67616d0000b273e5b6b4b3e4c4f2c3f5b90b6d",
            chartPosition: 1,
            weeksAtNumber1: 7,
            preview_url: null,
            significance: "Global phenomenon that established Rihanna as a pop superstar"
          }
        ]
      };
    } else {
      return {
        year: year,
        description: "Streaming era and global pop takeover",
        color: "#9B59B6",
        culturalContext: "The 2010s brought us streaming dominance, social media virality, and a new generation of pop superstars who conquered the world.",
        hits: [
          {
            id: "10",
            name: "Rolling in the Deep",
            artist: "Adele",
            year: 2011,
            genre: "Soul/Pop",
            image: "https://i.scdn.co/image/ab67616d0000b273c7b4b2c5f4b4e4c7c4f2c3f5",
            chartPosition: 1,
            weeksAtNumber1: 7,
            preview_url: null,
            significance: "Soul-powered comeback that proved albums could still dominate in the digital age"
          },
          {
            id: "11",
            name: "Shape of You",
            artist: "Ed Sheeran",
            year: 2017,
            genre: "Pop",
            image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
            chartPosition: 1,
            weeksAtNumber1: 12,
            preview_url: null,
            significance: "Streaming giant that became one of the most-played songs of all time"
          },
          {
            id: "12",
            name: "Old Town Road",
            artist: "Lil Nas X ft. Billy Ray Cyrus",
            year: 2019,
            genre: "Country Rap",
            image: "https://i.scdn.co/image/ab67616d0000b2736f2f499c1df1f210c9b34b58",
            chartPosition: 1,
            weeksAtNumber1: 19,
            preview_url: null,
            significance: "Viral TikTok sensation that broke the record for longest-running #1 hit"
          }
        ]
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ClockIcon className="w-8 h-8 text-orange-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Nostalgic Musical Time Machine
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Travel back to any year and rediscover the biggest chart-topping hits that defined that era. 
            Experience the nostalgic magic of the songs that dominated the airwaves and shaped musical history.
          </p>
        </div>

        {/* Year Input */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CalendarIcon className="w-6 h-6 text-orange-400" />
              Choose Your Nostalgic Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <Label htmlFor="year" className="text-lg font-medium">
                  Enter a year (1980-2020)
                </Label>
                <Input
                  id="year"
                  type="number"
                  min="1980"
                  max="2020"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="e.g., 1995"
                  className="mt-2 text-lg bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Button
                onClick={generateNostalgicHits}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 animate-spin" />
                    Traveling Through Time...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MusicIcon className="w-5 h-5" />
                    Discover Nostalgic Chart Toppers
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {selectedYearData && (
          <div className="space-y-8">
            {/* Era Header */}
            <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-4" style={{ color: selectedYearData.color }}>
                    {selectedYearData.year} • Chart-Topping Nostalgic Hits
                  </h2>
                  <p className="text-xl text-gray-300 mb-4">
                    {selectedYearData.description}
                  </p>
                  <p className="text-gray-400 leading-relaxed max-w-4xl mx-auto">
                    {selectedYearData.culturalContext}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Chart Toppers */}
            <div className="grid gap-6">
              <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <TrendingUpIcon className="w-6 h-6 text-orange-400" />
                Biggest Hits That Dominated The Charts
              </h3>
              
              {selectedYearData.hits.map((hit, index) => (
                <Card key={hit.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      <div className="relative flex-shrink-0">
                        <img
                          src={hit.image}
                          alt={hit.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 bg-orange-600 text-white text-sm font-bold"
                        >
                          #{hit.chartPosition}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-4">
                        <div>
                          <h3 className="font-bold text-white text-xl mb-2">{hit.name}</h3>
                          <p className="text-gray-300 text-lg">{hit.artist}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline" className="text-orange-400 border-orange-400">
                              {hit.year}
                            </Badge>
                            <Badge variant="outline" className="text-purple-400 border-purple-400">
                              {hit.genre}
                            </Badge>
                            {hit.weeksAtNumber1 > 0 && (
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {hit.weeksAtNumber1} weeks at #1
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                          <h4 className="font-semibold text-orange-400 mb-2">Nostalgic Significance</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {hit.significance}
                          </p>
                        </div>
                        
                        <AudioPlayer
                          src={hit.preview_url}
                          trackName={hit.name}
                          artistName={hit.artist}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}