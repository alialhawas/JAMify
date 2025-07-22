import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SpotifyProvider } from "@/context/SpotifyContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { NowPlaying } from "@/components/layout/NowPlaying";

import Home from "@/pages/Home";
import Stats from "@/pages/Stats";
import Generate from "@/pages/Generate";
import Recommendations from "@/pages/Recommendations";
import TimeMachine from "@/pages/TimeMachine";
import MelodyMirror from "@/pages/MelodyMirror";
import About from "@/pages/About";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

import { useEffect } from "react";
import { useLocation } from "wouter";

export function CallbackHandler() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("http://localhost:8000/verify-jwt", {
      method: "GET",
      credentials: "include", // send cookies automatically
    }).then(res => {
      if (res.ok) {
        setLocation("/stats"); // or wherever after successful login
      } else {
        setLocation("/login"); // failed login or token expired
      }
    });
  }, []);

  return <p>Processing login...</p>;
}


function Router() {
  return (
    <Switch>
      <Route path="/" component={About} />
      <Route path="/stats" component={Stats} />
      <Route path="/generate" component={Generate} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/time-machine" component={TimeMachine} />
      <Route path="/melody-mirror" component={MelodyMirror} />
      <Route path="/about" component={About} />
      <Route path="/settings" component={Settings} />
      <Route path="/callback" component={CallbackHandler} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SpotifyProvider>
        <PlayerProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* Conditionally show mobile menu */}
            {mobileMenuOpen && (
              <div className="md:hidden fixed inset-0 z-50 bg-black">
                <div className="flex justify-end p-4">
                  <button onClick={toggleMobileMenu} className="text-white">
                    ✕
                  </button>
                </div>
                <Sidebar />
              </div>
            )}
            
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="md:ml-64 flex-grow">
              <TopBar onMenuClick={toggleMobileMenu} />
              
              <Router />
              
              <NowPlaying />
              
              {/* Add padding at the bottom for the now playing bar */}
              <div className="h-16"></div>
            </div>
          </div>
          <Toaster />
        </PlayerProvider>
      </SpotifyProvider>
    </QueryClientProvider>
  );
}

export default App;
