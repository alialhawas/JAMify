import { SpotifyTrack, SpotifyArtist, SpotifyProfile, UserStats, RecommendedTrack } from "@shared/schema";

export interface SpotifyAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface GenerateMusicParams {
  genre: string;
  mood: string;
  inspiration?: string;
  duration: number;
}

export interface GeneratedMusicResponse {
  id: number;
  title: string;
  audioUrl: string;
  genre: string;
  mood: string;
  duration: number;
  inspiration?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: SpotifyTrack | GeneratedMusicResponse | null;
  progress: number;
  duration: number;
  isGeneratedTrack: boolean;
}

export type {
  SpotifyTrack,
  SpotifyArtist,
  SpotifyProfile,
  UserStats,
  RecommendedTrack
};
