import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ArtistItemProps {
  className?: string;
  name: string;
  imageUrl?: string;
  playCount: number;
}

export function ArtistItem({ className, name, imageUrl, playCount }: ArtistItemProps) {
  // Extract first letter of artist name for avatar fallback
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={cn("flex items-center", className)}>
      <Avatar className="w-10 h-10 mr-3">
        {imageUrl ? (
          <AvatarImage src={imageUrl} alt={name} />
        ) : null}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      
      <div className="flex-grow">
        <div className="flex justify-between">
          <span className="font-medium">{name}</span>
          <span className="text-[#B3B3B3] text-sm">{playCount} plays</span>
        </div>
      </div>
    </div>
  );
}
