import { useState } from "react";

export function useSpotifyOperations() {
  // Assume authenticated (e.g. on login page after successful login)
  const [isAuthenticated] = useState(true);

  const login = () => {
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000"
        : "https://your-production-backend.com";

    window.location.href = `${baseUrl}/login`;
  };

  return {
    isAuthenticated,
    login,
  };
}
