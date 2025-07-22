export function useSpotifyOperations() {
  const login = () => {
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000"
        : "https://your-production-backend.com"; // TODO add prod url later

    window.location.href = `${baseUrl}/login`;
  };

  const isAuthenticated = !!localStorage.getItem("access_token"); 

  return {
    isAuthenticated,
    login,
  };
}
