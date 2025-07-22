import React from 'react';

interface JamifyLogoProps {
  className?: string;
  size?: number;
}

export function JamifyLogo({ className = "", size = 32 }: JamifyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="jamifyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1DB954" />
          <stop offset="100%" stopColor="#1ed760" />
        </linearGradient>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#jamifyGradient)"
        stroke="#0d7c35"
        strokeWidth="2"
      />
      
      {/* Sound waves */}
      <path
        d="M15 35 Q25 25 35 35 T55 35 T75 35 T95 35"
        stroke="url(#waveGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M15 45 Q25 35 35 45 T55 45 T75 45 T95 45"
        stroke="url(#waveGradient)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M15 55 Q25 45 35 55 T55 55 T75 55 T95 55"
        stroke="url(#waveGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M15 65 Q25 55 35 65 T55 65 T75 65 T95 65"
        stroke="url(#waveGradient)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Central music note */}
      <circle cx="50" cy="50" r="8" fill="white" />
      <ellipse cx="50" cy="58" rx="3" ry="2" fill="white" />
      <rect x="53" y="42" width="2" height="16" fill="white" />
      
      {/* J letter overlay */}
      <text
        x="50"
        y="75"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="bold"
        fontFamily="Montserrat, sans-serif"
      >
        J
      </text>
    </svg>
  );
}

export function JamifyWordmark({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <JamifyLogo size={size === "sm" ? 24 : size === "md" ? 32 : 48} />
      <span className={`font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent ${sizeClasses[size]}`}>
        JAMIFY
      </span>
    </div>
  );
}