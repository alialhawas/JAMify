import { useState } from "react";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { LoginModal } from "@/components/modals/LoginModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { isAuthenticated, login, logout, profile } = useSpotifyOperations();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Settings state (these would be saved to user preferences in a real app)
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated."
    });
  };
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
  };
  
  const handleDeleteAccount = () => {
    // This would trigger an account deletion process in a real app
    toast({
      title: "Account Deletion Requested",
      description: "We've sent you an email with confirmation steps.",
      variant: "destructive"
    });
  };
  
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* Account Section */}
      <Card className="bg-[#282828] border-none mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Connected Account</h3>
                <p className="text-[#B3B3B3] mb-4">
                  You're logged in as <span className="text-white font-medium">{profile?.display_name || "Spotify User"}</span>
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                >
                  Disconnect Account
                </Button>
              </div>
              
              <Separator className="my-6 bg-[#333333]" />
              
              <div>
                <h3 className="text-lg font-medium mb-2 text-red-500">Danger Zone</h3>
                <p className="text-[#B3B3B3] mb-4">
                  Permanently delete your account and all your data
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-[#B3B3B3] mb-4">
                Connect your Spotify account to manage your settings
              </p>
              <Button 
                className="bg-[#1DB954] hover:bg-[#1ED760] text-black" 
                onClick={() => setLoginModalOpen(true)}
              >
                Connect Spotify Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Preferences */}
      <Card className="bg-[#282828] border-none mb-6">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-[#B3B3B3]">
                Use dark theme throughout the application
              </p>
            </div>
            <Switch 
              checked={darkMode} 
              onCheckedChange={setDarkMode} 
            />
          </div>
          
          <Separator className="bg-[#333333]" />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-[#B3B3B3]">
                Receive updates about new features and music
              </p>
            </div>
            <Switch 
              checked={emailNotifications} 
              onCheckedChange={setEmailNotifications} 
            />
          </div>
          
          <Separator className="bg-[#333333]" />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Data Sharing</Label>
              <p className="text-sm text-[#B3B3B3]">
                Allow anonymous data collection to improve our service
              </p>
            </div>
            <Switch 
              checked={dataSharing} 
              onCheckedChange={setDataSharing} 
            />
          </div>
          
          <Button 
            className="bg-[#1DB954] hover:bg-[#1ED760] text-black w-full mt-4" 
            onClick={handleSaveSettings}
          >
            Save Preferences
          </Button>
        </CardContent>
      </Card>
      
      {/* About */}
      <Card className="bg-[#282828] border-none">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#B3B3B3] mb-2">
            Rhythmix v1.0.0
          </p>
          <p className="text-[#B3B3B3] mb-4">
            A Spotify-connected app that displays user listening data, generates music, and suggests similar songs based on user taste.
          </p>
          <div className="flex space-x-4">
            <Button variant="outline">Privacy Policy</Button>
            <Button variant="outline">Terms of Service</Button>
          </div>
        </CardContent>
      </Card>
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </main>
  );
}
