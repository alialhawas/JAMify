import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SpotifyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  icon?: React.ReactNode;
}

const SpotifyButton = React.forwardRef<HTMLButtonElement, SpotifyButtonProps>(
  ({ className, children, variant = "default", size = "default", icon, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "font-medium rounded-full transition-colors duration-300",
          variant === "default" 
            ? "bg-[#1DB954] hover:bg-[#1ED760] text-black" 
            : "bg-transparent border border-[#B3B3B3] hover:border-white text-white",
          size === "sm" ? "text-xs py-2 px-3" : 
          size === "lg" ? "text-base py-3 px-6" : 
          "text-sm py-2 px-4",
          className
        )}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
    );
  }
);

SpotifyButton.displayName = "SpotifyButton";

export { SpotifyButton };
