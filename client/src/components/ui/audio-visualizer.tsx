import * as React from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  className?: string;
  playing?: boolean;
  barCount?: number;
}

export function AudioVisualizer({ 
  className, 
  playing = true,
  barCount = 5 
}: AudioVisualizerProps) {
  return (
    <div className={cn("flex items-end space-x-1", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 bg-[#1DB954] rounded-t transition-all",
            playing ? "animate-[equalizer_1.5s_infinite_ease-in-out]" : "h-3"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
