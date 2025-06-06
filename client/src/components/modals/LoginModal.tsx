import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { SiSpotify } from "react-icons/si";
import { useSpotify } from "@/context/SpotifyContext";
import { Info } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useSpotify();
  
  const handleLogin = () => {
    login();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#282828] text-white border-[#333333] p-8 max-w-md w-full rounded-xl">
        <div className="text-center mb-6">
          <SiSpotify className="text-[#1DB954] text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect to Spotify</h2>
          <p className="text-[#B3B3B3]">
            Log in to your Spotify account to access your music data and unlock personalized features.
          </p>
        </div>
        
        <div className="space-y-4">
          <SpotifyButton 
            onClick={handleLogin} 
            className="w-full py-3" 
            icon={<SiSpotify />}
          >
            Continue with Spotify
          </SpotifyButton>
          
          <SpotifyButton 
            onClick={onClose} 
            className="w-full py-3" 
            variant="outline"
          >
            Cancel
          </SpotifyButton>
        </div>
        
        <div className="mt-6 text-center text-[#B3B3B3] text-xs">
          <p>
            By connecting, you agree to the <a href="#" className="text-[#1DB954] hover:underline">Terms of Service</a> and <a href="#" className="text-[#1DB954] hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
