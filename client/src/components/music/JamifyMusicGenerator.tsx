import { useState } from "react";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateJamifySong, JamifyGenerateSongRequest, JamifyGeneratedSong } from "@/lib/jamifyApi";
import { Music2Icon, RefreshCwIcon, YoutubeIcon, PenToolIcon, PlayIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JamifyMusicGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<JamifyGeneratedSong | null>(null);
  const [lyricPrompt, setLyricPrompt] = useState("");
  const [songPrompt, setSongPrompt] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [activeTab, setActiveTab] = useState("prompt");
  const { toast } = useToast();
  
  const handleGenerate = async () => {
    if (!lyricPrompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a lyric prompt to generate your song.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === "prompt" && !songPrompt.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please provide a song prompt for the style.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === "youtube" && !youtubeLink.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a YouTube link for style reference.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const request: JamifyGenerateSongRequest = {
        lyric_prompt: lyricPrompt,
        ...(activeTab === "prompt" ? { song_prompt: songPrompt } : { youTube_link: youtubeLink })
      };
      
      const result = await generateJamifySong(request);
      setGeneratedSong(result);
      
      toast({
        title: "Song Generated!",
        description: "Your personalized song has been created successfully."
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate song. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2Icon className="w-6 h-6 text-green-400" />
            JAMIFY Song Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lyric Prompt */}
          <div>
            <Label htmlFor="lyric-prompt" className="text-gray-200 flex items-center gap-2">
              <PenToolIcon className="w-4 h-4" />
              Lyric Prompt
            </Label>
            <Textarea
              id="lyric-prompt"
              placeholder="Describe what you want your song to be about... (e.g., 'A song about overcoming challenges and finding strength')"
              className="bg-gray-900 border-gray-600 text-white mt-2"
              value={lyricPrompt}
              onChange={(e) => setLyricPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Style Reference Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="prompt" className="flex items-center gap-2">
                <PenToolIcon className="w-4 h-4" />
                Style Prompt
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <YoutubeIcon className="w-4 h-4" />
                YouTube Reference
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="prompt" className="space-y-4">
              <div>
                <Label htmlFor="song-prompt" className="text-gray-200">
                  Song Style Prompt
                </Label>
                <Input
                  id="song-prompt"
                  placeholder="Describe the musical style... (e.g., 'Upbeat pop with electronic elements')"
                  className="bg-gray-900 border-gray-600 text-white mt-2"
                  value={songPrompt}
                  onChange={(e) => setSongPrompt(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="youtube" className="space-y-4">
              <div>
                <Label htmlFor="youtube-link" className="text-gray-200">
                  YouTube Link
                </Label>
                <Input
                  id="youtube-link"
                  placeholder="Paste YouTube URL to match the style and vibe..."
                  className="bg-gray-900 border-gray-600 text-white mt-2"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <SpotifyButton 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            icon={isGenerating ? <RefreshCwIcon className="animate-spin" size={16} /> : <Music2Icon size={16} />}
          >
            {isGenerating ? "Generating Your Song..." : "Generate Song"}
          </SpotifyButton>
        </CardContent>
      </Card>
      
      {generatedSong && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Song</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                JAMIFY Original
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg text-white">{generatedSong.title}</h4>
              {generatedSong.style && (
                <p className="text-gray-400 text-sm">Style: {generatedSong.style}</p>
              )}
            </div>
            
            {generatedSong.lyrics && (
              <div className="bg-gray-900 rounded-lg p-4">
                <Label className="text-gray-200 font-medium">Lyrics:</Label>
                <div className="mt-2 text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                  {generatedSong.lyrics}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {generatedSong.audio_url && (
                <Button 
                  onClick={() => window.open(generatedSong.audio_url, '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Play Audio
                </Button>
              )}
              <Button 
                onClick={handleGenerate}
                variant="outline"
                disabled={isGenerating}
                className="border-gray-600 hover:bg-gray-700"
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Generate New Version
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}