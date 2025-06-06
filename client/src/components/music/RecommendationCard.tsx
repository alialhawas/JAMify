import { RecommendedTrack } from "@/types";

interface RecommendationCardProps {
  track: RecommendedTrack;
}

export function RecommendationCard({ track }: RecommendationCardProps) {
  return (
    <div className="bg-[#282828] p-4 rounded-md hover:bg-[#333333] transition duration-300 cursor-pointer">
      <div className="mb-3 rounded-md overflow-hidden">
        {track.imageUrl ? (
          <img 
            src={track.imageUrl} 
            alt={`${track.name} album art`} 
            className="w-full object-cover aspect-square"
          />
        ) : (
          <div className="w-full aspect-square bg-[#333333] flex items-center justify-center">
            <span className="text-[#1DB954] text-2xl">♪</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold truncate">{track.name}</h3>
      <p className="text-[#B3B3B3] text-sm truncate">{track.artist}</p>
    </div>
  );
}
