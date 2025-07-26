// import { useState } from "react";

// export function useSpotifyOperations() {
//   // Assume authenticated (e.g. on login page after successful login)
//   const [isAuthenticated] = useState(true);

//   const login = () => {
//     const baseUrl =
//       process.env.NODE_ENV === "development"
//         ? "http://localhost:8000"
//         : "https://your-production-backend.com";

//     window.location.href = `${baseUrl}/login`;
//   };

//   return {
//     isAuthenticated,
//     login,
//   };
// }


import { useEffect, useState } from "react";

const BACKEND_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://your-production-backend.com";

export function useSpotifyOperations() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const login = () => {
    window.location.href = `${BACKEND_URL}/login`; // this should redirect to backend login
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${BACKEND_URL}/profile`, {
          credentials: "include", // includes cookie (e.g. with JWT or session id)
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setIsAuthenticated(true);
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      } catch (err) {
        console.warn("Not authenticated or failed to fetch profile");
        setIsAuthenticated(false);
      }
    }

    fetchProfile();
  }, []);

  const hasAvatar = !!avatarUrl;

  return {
    BACKEND_URL,
    isAuthenticated,
    login,
    displayName: displayName ?? "",
    avatarUrl,
    hasAvatar,
  };
}


