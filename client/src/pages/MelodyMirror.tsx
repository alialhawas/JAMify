import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { LoginModal } from "@/components/modals/LoginModal";
import { ScanFaceIcon, SparklesIcon, UserIcon, HeartIcon, BrainIcon, TrendingUpIcon } from "lucide-react";

interface PersonalityTrait {
  name: string;
  score: number;
  description: string;
  color: string;
}

interface MusicPersonality {
  traits: PersonalityTrait[];
  overallProfile: string;
  musicMatches: string[];
  recommendations: string[];
  insights: string[];
}

export default function MelodyMirror() {
  const { isAuthenticated } = useSpotifyOperations();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [personality, setPersonality] = useState<MusicPersonality | null>(null);

  const analyzeMusicPersonality = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis based on user's music data
    setTimeout(() => {
      const analyzedPersonality = generatePersonalityFromMusicTaste();
      setPersonality(analyzedPersonality);
      setIsAnalyzing(false);
    }, 3000);
  };

  const generatePersonalityFromMusicTaste = (): MusicPersonality => {
    // Mock analysis based on typical listening patterns
    return {
      traits: [
        {
          name: "Musical Adventurer",
          score: 85,
          description: "You love discovering new artists and exploring different genres. Your playlist is a journey through diverse musical landscapes.",
          color: "#FF6B6B"
        },
        {
          name: "Emotional Connector",
          score: 92,
          description: "Music is your emotional outlet. You connect deeply with lyrics and melodies that resonate with your feelings.",
          color: "#4ECDC4"
        },
        {
          name: "Trend Awareness",
          score: 78,
          description: "You stay current with popular music while maintaining your unique taste. You appreciate both mainstream hits and underground gems.",
          color: "#45B7D1"
        },
        {
          name: "Nostalgic Soul",
          score: 70,
          description: "You cherish music from different eras. Your taste spans decades, showing appreciation for musical history and evolution.",
          color: "#96CEB4"
        },
        {
          name: "Social Listener",
          score: 65,
          description: "Music brings you closer to others. You enjoy sharing discoveries and creating playlists for different moods and occasions.",
          color: "#FECA57"
        }
      ],
      overallProfile: "The Eclectic Curator",
      musicMatches: [
        "Indie Pop Enthusiast - You gravitate toward artistic, melody-driven music with emotional depth",
        "Alternative Rock Appreciator - You value authenticity and raw musical expression",
        "Electronic Explorer - You're drawn to innovative sounds and production techniques",
        "Pop Connoisseur - You appreciate well-crafted hooks and polished songwriting"
      ],
      recommendations: [
        "Explore more artists from the indie-folk genre to expand your emotional connection to music",
        "Try creating themed playlists based on different decades to satisfy your nostalgic tendencies",
        "Discover emerging artists in electronic music to feed your adventurous spirit",
        "Join music communities to share your curated discoveries with fellow enthusiasts"
      ],
      insights: [
        "Your music taste reveals a balanced personality that values both innovation and tradition",
        "You likely use music as a form of self-expression and emotional regulation",
        "Your diverse listening habits suggest you're open-minded and culturally curious",
        "You probably have strong memories associated with specific songs and artists",
        "Your taste indicates you value artistic integrity alongside mainstream appeal"
      ]
    };
  };

  const mockPersonalityForDemo = (): MusicPersonality => {
    return {
      traits: [
        {
          name: "Musical Adventurer",
          score: 88,
          description: "Based on your diverse artist selection, you love exploring new musical territories and aren't afraid to venture outside your comfort zone.",
          color: "#FF6B6B"
        },
        {
          name: "Emotional Connector",
          score: 94,
          description: "Your top tracks show deep emotional resonance. You use music to process feelings and connect with meaningful experiences.",
          color: "#4ECDC4"
        },
        {
          name: "Pop Culture Enthusiast",
          score: 82,
          description: "Your genre preferences indicate you stay connected to current trends while appreciating timeless musical elements.",
          color: "#45B7D1"
        },
        {
          name: "Melody Appreciator",
          score: 76,
          description: "Your listening patterns reveal a strong appreciation for well-crafted melodies and memorable hooks.",
          color: "#96CEB4"
        },
        {
          name: "Nostalgic Romantic",
          score: 71,
          description: "Your music choices suggest you value emotional storytelling and songs that transport you to different moments in time.",
          color: "#FECA57"
        }
      ],
      overallProfile: "The Emotionally-Driven Pop Explorer",
      musicMatches: [
        "Contemporary Pop Lover - You're drawn to current hits with emotional depth and strong melodies",
        "Alternative Indie Fan - You appreciate artistic integrity in mainstream-adjacent music",
        "Nostalgic Romanticist - You connect with songs that tell stories and evoke memories",
        "Genre-Blending Enthusiast - You enjoy artists who experiment across musical boundaries"
      ],
      recommendations: [
        "Explore more singer-songwriter artists to deepen your emotional music connection",
        "Try discovering international pop artists to expand your melodic horizons",
        "Create mood-based playlists to enhance your emotional listening experience",
        "Look into artists who blend pop with alternative or indie elements"
      ],
      insights: [
        "Your music taste suggests you're emotionally intelligent and value authentic expression",
        "You likely use music as a soundtrack to your life's important moments",
        "Your preferences indicate you balance mainstream appeal with artistic uniqueness",
        "You probably have strong associations between specific songs and personal memories",
        "Your listening habits reveal someone who appreciates both lyrical content and musical craftsmanship"
      ]
    };
  };

  const handleLoginClick = () => {
    setLoginModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <ScanFaceIcon className="w-8 h-8 text-purple-400" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Melody Mirror
                </h1>
              </div>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Discover what your music taste reveals about your personality. Get insights into your musical DNA 
                based on your top artists, tracks, and genre preferences.
              </p>
            </div>

            {/* Demo Section */}
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <SparklesIcon className="w-6 h-6 text-purple-400" />
                  See Your Musical Personality
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <p className="text-gray-300 leading-relaxed">
                  Connect your Spotify account to unlock a detailed analysis of your musical personality. 
                  Discover what your listening habits reveal about who you are.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <UserIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-2">Personality Traits</h4>
                    <p className="text-sm text-gray-400">Musical Adventurer, Emotional Connector, Trend Awareness</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <HeartIcon className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-2">Music Matches</h4>
                    <p className="text-sm text-gray-400">Pop Enthusiast, Alternative Appreciator, Indie Explorer</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <BrainIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-2">Insights</h4>
                    <p className="text-sm text-gray-400">Emotional intelligence, Cultural curiosity, Artistic appreciation</p>
                  </div>
                </div>

                <Button 
                  onClick={handleLoginClick}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3"
                >
                  Connect Spotify to Reveal Your Musical DNA
                </Button>

                {/* Demo Preview */}
                <div className="mt-12 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Preview: Sample Musical Personality</h3>
                  <div className="text-left space-y-4">
                    {mockPersonalityForDemo().traits.slice(0, 2).map((trait, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{trait.name}</span>
                          <span className="text-sm text-gray-400">{trait.score}%</span>
                        </div>
                        <Progress value={trait.score} className="h-2" />
                        <p className="text-sm text-gray-300">{trait.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ScanFaceIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Melody Mirror
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover what your music taste reveals about your personality
          </p>
        </div>

        {/* Analyze Button */}
        {!personality && (
          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardContent className="text-center p-8">
              <Button
                onClick={analyzeMusicPersonality}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 text-lg"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 animate-spin" />
                    Analyzing Your Musical DNA...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ScanFaceIcon className="w-5 h-5" />
                    Reveal My Musical Personality
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {personality && (
          <div className="space-y-8">
            {/* Overall Profile */}
            <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {personality.overallProfile}
                </h2>
                <p className="text-xl text-gray-300">
                  Your unique musical personality, revealed through your listening habits
                </p>
              </CardContent>
            </Card>

            {/* Personality Traits */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-purple-400" />
                  Your Musical Personality Traits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {personality.traits.map((trait, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-lg">{trait.name}</h3>
                      <Badge 
                        variant="outline" 
                        className="text-white border-gray-500"
                        style={{ backgroundColor: `${trait.color}20`, borderColor: trait.color }}
                      >
                        {trait.score}%
                      </Badge>
                    </div>
                    <Progress 
                      value={trait.score} 
                      className="h-3"
                      style={{ 
                        background: `linear-gradient(to right, ${trait.color}40, ${trait.color}80)` 
                      }}
                    />
                    <p className="text-gray-300 leading-relaxed">{trait.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Music Matches */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <HeartIcon className="w-6 h-6 text-pink-400" />
                  Your Music Archetype Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {personality.musicMatches.map((match, index) => (
                    <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-gray-300">{match}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BrainIcon className="w-5 h-5 text-blue-400" />
                    Personality Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {personality.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <SparklesIcon className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-green-400" />
                    Musical Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {personality.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <TrendingUpIcon className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regenerate Button */}
            <div className="text-center">
              <Button
                onClick={() => setPersonality(null)}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
              >
                Analyze Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}