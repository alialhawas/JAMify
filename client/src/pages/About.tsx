import { JamifyWordmark } from "@/components/ui/jamify-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MusicIcon, BrainIcon, SearchIcon, LinkIcon, ClockIcon, BarChart3Icon, ScanFaceIcon } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <MusicIcon className="w-6 h-6" />,
      title: "Spotify Integration",
      description: "Connect your account for deep music personality analysis",
      color: "bg-green-500/10 text-green-400 border-green-500/20"
    },
    {
      icon: <BarChart3Icon className="w-6 h-6" />,
      title: "Music Analytics Dashboard",
      description: "View your top artists, tracks, and genre preferences with interactive audio previews",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      icon: <SearchIcon className="w-6 h-6" />,
      title: "Smart Recommendations",
      description: "AI-powered song suggestions tailored to your listening history",
      color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    },
    {
      icon: <BrainIcon className="w-6 h-6" />,
      title: "AI Song Generation",
      description: "Create original lyrics and melodies inspired by your music taste",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    {
      icon: <LinkIcon className="w-6 h-6" />,
      title: "YouTube Style Matching",
      description: "Reference any song for vibe-matching AI generation",
      color: "bg-red-500/10 text-red-400 border-red-500/20"
    },
    {
      icon: <ClockIcon className="w-6 h-6" />,
      title: "Musical Time Machine",
      description: "Travel back to any year and discover the biggest chart-topping hits that defined that era",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20"
    },
    {
      icon: <ScanFaceIcon className="w-6 h-6" />,
      title: "Melody Mirror",
      description: "Discover what your music taste reveals about your personality with detailed psychological insights",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <JamifyWordmark size="lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Personalized Music Assistant
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              JAMIFY is your comprehensive music discovery and generation platform. Connect your Spotify account to unlock 
              detailed analytics of your listening habits, discover new songs tailored to your taste, and create original 
              AI-generated music inspired by your unique preferences.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              From nostalgic playlist generation based on your birth year to real-time audio previews of your top tracks, 
              JAMIFY transforms your music data into personalized experiences and creative inspiration.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            ✨ Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <Card className="bg-gray-800/30 border-gray-700 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
              How JAMIFY Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-400 font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold mb-2 text-green-400">Connect</h3>
                <p className="text-sm text-gray-300">Link your Spotify account for deep music analysis</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-400 font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold mb-2 text-blue-400">Analyze</h3>
                <p className="text-sm text-gray-300">View detailed statistics with audio previews of your top content</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-cyan-400 font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold mb-2 text-cyan-400">Discover</h3>
                <p className="text-sm text-gray-300">Get AI-powered recommendations and explore nostalgic playlists</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-400 font-bold text-xl">4</span>
                </div>
                <h3 className="font-semibold mb-2 text-purple-400">Create</h3>
                <p className="text-sm text-gray-300">Generate original songs with lyric prompts and style references</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's New Section */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Latest Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-orange-400 mb-2">Nostalgic Musical Time Machine</h4>
                <p className="text-sm text-gray-300">Travel back to any year (1980-2020) and rediscover the biggest chart-topping hits that defined that era.</p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-blue-400 mb-2">Audio Preview System</h4>
                <p className="text-sm text-gray-300">Listen to 30-second previews of your top tracks with interactive playback controls and volume adjustment.</p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-purple-400 mb-2">Melody Mirror</h4>
                <p className="text-sm text-gray-300">Discover what your music taste reveals about your personality with detailed psychological insights and trait analysis.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Your music, reimagined with AI
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Connect your Spotify account to unlock personalized insights, discover new music, and create original songs inspired by your unique taste.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              Spotify Analytics
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              Audio Previews
            </Badge>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              ML Recommendations
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              AI Song Generation
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              YouTube Integration
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
              Time Machine
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              Melody Mirror
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}