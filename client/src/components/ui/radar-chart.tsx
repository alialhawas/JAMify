import * as React from "react";
import { cn } from "@/lib/utils";

interface RadarChartProps {
  className?: string;
  data: {
    energetic: number;
    happy: number;
    relaxed: number;
    calm: number;
    sad: number;
    intense: number;
  };
  size?: number;
}

export function RadarChart({ className, data, size = 200 }: RadarChartProps) {
  // Convert data values to x,y coordinates on radar chart
  const getPoint = (index: number, value: number) => {
    // 6 dimensions = 60 degrees per dimension
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const distance = size * 0.4 * value; // Scale by factor of chart size
    const x = size / 2 + Math.cos(angle) * distance;
    const y = size / 2 + Math.sin(angle) * distance;
    return { x, y };
  };

  // Calculate the polygon points for data values
  const points = [
    getPoint(0, data.energetic),
    getPoint(1, data.happy),
    getPoint(2, data.relaxed),
    getPoint(3, data.calm),
    getPoint(4, data.sad),
    getPoint(5, data.intense),
  ];

  const polygonPoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("w-full h-full", className)}
    >
      {/* Chart background hexagons */}
      <polygon
        points={`${size / 2},${size * 0.1} ${size * 0.85},${size * 0.25} ${size * 0.85},${size * 0.75} ${size / 2},${size * 0.9} ${size * 0.15},${size * 0.75} ${size * 0.15},${size * 0.25}`}
        fill="none"
        stroke="#333"
        strokeWidth="1"
      />
      <polygon
        points={`${size / 2},${size * 0.25} ${size * 0.65},${size * 0.35} ${size * 0.65},${size * 0.65} ${size / 2},${size * 0.75} ${size * 0.35},${size * 0.65} ${size * 0.35},${size * 0.35}`}
        fill="none"
        stroke="#333"
        strokeWidth="1"
      />
      <polygon
        points={`${size / 2},${size * 0.4} ${size * 0.55},${size * 0.45} ${size * 0.55},${size * 0.55} ${size / 2},${size * 0.6} ${size * 0.45},${size * 0.55} ${size * 0.45},${size * 0.45}`}
        fill="none"
        stroke="#333"
        strokeWidth="1"
      />

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(29,185,84,0.3)"
        stroke="#1DB954"
        strokeWidth="2"
      />

      {/* Labels */}
      <text
        x={size / 2}
        y={size * 0.05}
        textAnchor="middle"
        fill="#B3B3B3"
        fontSize={size * 0.04}
      >
        Energetic
      </text>
      <text
        x={size * 0.9}
        y={size * 0.25}
        textAnchor="start"
        fill="#B3B3B3"
        fontSize={size * 0.04}
      >
        Happy
      </text>
      <text
        x={size * 0.9}
        y={size * 0.75}
        textAnchor="start"
        fill="#B3B3B3"
        fontSize={size * 0.04}
      >
        Relaxed
      </text>
      <text
        x={size / 2}
        y={size * 0.95}
        textAnchor="middle"
        fill="#B3B3B3"
        fontSize={size * 0.04}
      >
        Calm
      </text>
      <text
        x={size * 0.1}
        y={size * 0.75}
        textAnchor="end"
        fill="#B3B3B3"
        fontSize={size * 0.04}
      >
        Sad
      </text>
      <text
        x={size * 0.1}
        y={size * 0.25}
        textAnchor="end"
        fill="#B3B3B3"
        fontSize={size * 0.04}
      >
        Intense
      </text>
    </svg>
  );
}
