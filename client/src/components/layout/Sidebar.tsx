import { useState } from "react";
import { useLocation } from "wouter";
import { useSpotifyOperations } from "@/hooks/useSpotify";
import { SpotifyButton } from "@/components/ui/spotify-button";
import { 
  HomeIcon, 
  BarChart2Icon,
  Music2Icon,
  HeartIcon,
  Settings2Icon
} from "lucide-react";
import { SiSpotify } from "react-icons/si";

export function Sidebar() {
  const [location] = useLocation();
  const { isAuthenticated, login } = useSpotifyOperations();

  const menuItems = [
    { label: "Home", path: "/", icon: <HomeIcon className="mr-3 text-xl" /> },
    { label: "Your Stats", path: "/stats", icon: <BarChart2Icon className="mr-3 text-xl" /> },
    { label: "Generate Music", path: "/generate", icon: <Music2Icon className="mr-3 text-xl" /> },
    { label: "Recommendations", path: "/recommendations", icon: <HeartIcon className="mr-3 text-xl" /> },
    { label: "Settings", path: "/settings", icon: <Settings2Icon className="mr-3 text-xl" /> }
  ];

  return (
    <div className="bg-black md:w-64 w-full md:min-h-screen md:fixed md:left-0 md:top-0 md:bottom-0 z-10">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <SiSpotify className="text-[#1DB954] text-3xl mr-2" />
          <h1 className="text-xl font-bold">Rhythmix</h1>
        </div>
        
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-4">
                <a 
                  href={item.path}
                  className={`flex items-center ${
                    location === item.path 
                      ? "text-[#1DB954]" 
                      : "text-white hover:text-[#1DB954]"
                  } transition duration-300 font-medium cursor-pointer`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-12 p-4 bg-[#282828] rounded-md">
          <h3 className="text-sm font-semibold mb-2">Connect with Spotify</h3>
          <SpotifyButton 
            onClick={login}
            className="w-full"
            icon={<SiSpotify />}
          >
            {isAuthenticated ? "Connected" : "Connect Account"}
          </SpotifyButton>
        </div>
      </div>
    </div>
  );
}
