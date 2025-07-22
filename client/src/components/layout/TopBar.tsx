import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { SiSpotify } from "react-icons/si";
import { MenuIcon } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { isAuthenticated, displayName, hasAvatar, avatarUrl } = useSpotifyOperations();

  return (
    <div className="bg-gradient-to-b from-[#282828] to-[#121212] p-4 flex justify-between items-center sticky top-0 z-5">
      <div className="md:hidden flex items-center">
        <button onClick={onMenuClick} className="text-white mr-4">
          <MenuIcon className="text-2xl" />
        </button>
        <SiSpotify className="text-[#1DB954] text-2xl" />
      </div>
      
      <div className="flex items-center ml-auto">
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
