import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { SiSpotify } from "react-icons/si";
import { MenuIcon, SearchIcon } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { isAuthenticated, displayName, hasAvatar, avatarUrl } = useSpotifyOperations();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-gradient-to-b from-[#282828] to-[#121212] p-4 flex justify-between items-center sticky top-0 z-5">
      <div className="md:hidden flex items-center">
        <button onClick={onMenuClick} className="text-white mr-4">
          <MenuIcon className="text-2xl" />
        </button>
        <SiSpotify className="text-[#1DB954] text-2xl" />
      </div>
      
      <div className="hidden md:block">
        <div className="flex items-center bg-[#282828] hover:bg-[#333333] rounded-full px-4 py-2 w-80 text-[#B3B3B3]">
          <SearchIcon className="mr-2" />
          <Input 
            type="text" 
            placeholder="Search for songs or artists" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="hidden md:flex items-center mr-4 text-sm text-[#B3B3B3]">
          <span>{isAuthenticated ? displayName : "Not connected"}</span>
        </div>
        <Avatar className="w-8 h-8">
          {hasAvatar ? (
            <AvatarImage src={avatarUrl} alt="User" />
          ) : null}
          <AvatarFallback className="bg-[#282828]">
            {isAuthenticated ? displayName.charAt(0) : "?"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
