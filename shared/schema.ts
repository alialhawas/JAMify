import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  spotifyId: text("spotify_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  lastDataFetch: timestamp("last_data_fetch"),
});

export const generatedTracks = pgTable("generated_tracks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  mood: text("mood").notNull(),
  duration: integer("duration").notNull(),
  inspiration: text("inspiration"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  topGenres: json("top_genres").$type<{ name: string; percentage: number; color: string }[]>(),
  topArtists: json("top_artists").$type<{ id: string; name: string; imageUrl: string; playCount: number }[]>(),
  listeningActivity: json("listening_activity").$type<{ day: string; count: number }[]>(),
  moodAnalysis: json("mood_analysis").$type<{
    energetic: number;
    happy: number;
    relaxed: number;
    calm: number;
    sad: number;
    intense: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRecommendations = pgTable("user_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tracks: json("tracks").$type<RecommendedTrack[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedTrackSchema = createInsertSchema(generatedTracks).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
});

export const insertUserRecommendationsSchema = createInsertSchema(userRecommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGeneratedTrack = z.infer<typeof insertGeneratedTrackSchema>;
export type GeneratedTrack = typeof generatedTracks.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStatsRecord = typeof userStats.$inferSelect;
export type InsertUserRecommendations = z.infer<typeof insertUserRecommendationsSchema>;
export type UserRecommendationsRecord = typeof userRecommendations.$inferSelect;

// Spotify API Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
}

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; height: number; width: number }[];
}

export interface UserStats {
  topGenres: { name: string; percentage: number; color: string }[];
  topArtists: { id: string; name: string; imageUrl: string; playCount: number }[];
  listeningActivity: { day: string; count: number }[];
  moodAnalysis: {
    energetic: number;
    happy: number;
    relaxed: number;
    calm: number;
    sad: number;
    intense: number;
  };
}

export interface RecommendedTrack {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
}
