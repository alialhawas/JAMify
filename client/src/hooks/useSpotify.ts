import { useEffect, useState } from "react";

const BACKEND_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://your-production-backend.com";

export function useSpotifyOperations() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  const login = () => {
    window.location.href = `${BACKEND_URL}/login`;
  };

  useEffect(() => {
    // Delay fetch until first render finishes and cookie may be set
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/profile`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setIsAuthenticated(true);
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      } catch (err) {
        // Avoid re-fetching unnecessarily
        setIsAuthenticated(false);
      } finally {
        setProfileChecked(true);
      }
    };

    fetchProfile();
  }, []);

  const hasAvatar = !!avatarUrl;

  return {
    BACKEND_URL,
    isAuthenticated,
    profileChecked, // useful to wait before showing UI
    login,
    displayName: displayName ?? "",
    avatarUrl,
    hasAvatar,
  };
}
