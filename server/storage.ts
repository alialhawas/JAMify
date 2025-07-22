import { 
  users, 
  generatedTracks,
  userStats,
  userRecommendations,
  type User, 
  type InsertUser, 
  type GeneratedTrack, 
  type InsertGeneratedTrack,
  type UserStatsRecord,
  type InsertUserStats,
  type UserRecommendationsRecord,
  type InsertUserRecommendations
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { redisCache } from "./redis";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(user: User): Promise<User>;
  updateUserDataFetchTime(userId: number): Promise<User>;
  createGeneratedTrack(track: InsertGeneratedTrack): Promise<GeneratedTrack>;
  getGeneratedTracksByUserId(userId: number): Promise<GeneratedTrack[]>;
  saveUserStats(userStats: InsertUserStats): Promise<UserStatsRecord>;
  getUserStats(userId: number): Promise<UserStatsRecord | undefined>;
  saveUserRecommendations(recommendations: InsertUserRecommendations): Promise<UserRecommendationsRecord>;
  getUserRecommendations(userId: number): Promise<UserRecommendationsRecord | undefined>;
  shouldRefreshUserData(userId: number, maxAgeDays: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private generatedTracks: Map<number, GeneratedTrack>;
  private userStatsData: Map<number, UserStatsRecord>;
  private userRecommendationsData: Map<number, UserRecommendationsRecord>;
  private userIdCounter: number;
  private trackIdCounter: number;
  private statsIdCounter: number;
  private recommendationsIdCounter: number;

  constructor() {
    this.users = new Map();
    this.generatedTracks = new Map();
    this.userStatsData = new Map();
    this.userRecommendationsData = new Map();
    this.userIdCounter = 1;
    this.trackIdCounter = 1;
    this.statsIdCounter = 1;
    this.recommendationsIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.spotifyId === spotifyId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure all required fields have non-undefined values
    const user: User = { 
      ...insertUser, 
      id,
      displayName: insertUser.displayName || null,
      email: insertUser.email || null,
      avatarUrl: insertUser.avatarUrl || null,
      lastDataFetch: null // Initialize with null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(updatedUser: User): Promise<User> {
    this.users.set(updatedUser.id, updatedUser);
    return updatedUser;
  }
  
  async createGeneratedTrack(track: InsertGeneratedTrack): Promise<GeneratedTrack> {
    const id = this.trackIdCounter++;
    // Ensure all required fields have non-undefined values
    const newTrack: GeneratedTrack = { 
      ...track, 
      id, 
      createdAt: new Date(),
      inspiration: track.inspiration || null,
      userId: track.userId || null,
      audioUrl: track.audioUrl || null
    };
    this.generatedTracks.set(id, newTrack);
    return newTrack;
  }
  
  async getGeneratedTracksByUserId(userId: number): Promise<GeneratedTrack[]> {
    return Array.from(this.generatedTracks.values()).filter(
      (track) => track.userId === userId,
    );
  }
  
  async updateUserDataFetchTime(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      lastDataFetch: new Date()
    };
    
    return this.updateUser(updatedUser);
  }
  
  async saveUserStats(stats: InsertUserStats): Promise<UserStatsRecord> {
    const id = this.statsIdCounter++;
    const statsRecord: UserStatsRecord = {
      id,
      userId: stats.userId,
      topGenres: stats.topGenres ? [...stats.topGenres] : null,
      topArtists: stats.topArtists ? [...stats.topArtists] : null,
      listeningActivity: stats.listeningActivity ? [...stats.listeningActivity] : null,
      moodAnalysis: stats.moodAnalysis || null,
      createdAt: new Date()
    };
    
    this.userStatsData.set(stats.userId, statsRecord);
    return statsRecord;
  }
  
  async getUserStats(userId: number): Promise<UserStatsRecord | undefined> {
    // Find stats by userId
    return Array.from(this.userStatsData.values()).find(
      (stats) => stats.userId === userId
    );
  }
  
  async saveUserRecommendations(recommendations: InsertUserRecommendations): Promise<UserRecommendationsRecord> {
    const id = this.recommendationsIdCounter++;
    const recommendationsRecord: UserRecommendationsRecord = {
      id,
      userId: recommendations.userId,
      tracks: recommendations.tracks ? [...recommendations.tracks] : null,
      createdAt: new Date()
    };
    
    this.userRecommendationsData.set(recommendations.userId, recommendationsRecord);
    return recommendationsRecord;
  }
  
  async getUserRecommendations(userId: number): Promise<UserRecommendationsRecord | undefined> {
    // Find recommendations by userId
    return Array.from(this.userRecommendationsData.values()).find(
      (recommendations) => recommendations.userId === userId
    );
  }
  
  async shouldRefreshUserData(userId: number, maxAgeDays: number = 3): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.lastDataFetch) {
      // If user doesn't exist or never fetched data before, we should refresh
      return true;
    }
    
    const lastFetchDate = new Date(user.lastDataFetch);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffMs = now.getTime() - lastFetchDate.getTime();
    // Convert to days
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // Return true if data is older than maxAgeDays
    return diffDays > maxAgeDays;
  }
}



// Hybrid storage class that combines MemStorage with Redis caching
export class HybridStorage extends MemStorage {
  private readonly CACHE_TTL = 3600; // 1 hour cache TTL
  
  private userCacheKey(id: number): string {
    return `user:${id}`;
  }
  
  private userByUsernameCacheKey(username: string): string {
    return `user:username:${username}`;
  }
  
  private userBySpotifyIdCacheKey(spotifyId: string): string {
    return `user:spotify:${spotifyId}`;
  }
  
  private userStatsCacheKey(userId: number): string {
    return `stats:${userId}`;
  }
  
  private userRecommendationsCacheKey(userId: number): string {
    return `recommendations:${userId}`;
  }

  async getUser(id: number): Promise<User | undefined> {
    // Try cache first
    const cacheKey = this.userCacheKey(id);
    const cached = await redisCache.getJSON<User>(cacheKey);
    if (cached) return cached;
    
    // Fallback to memory storage
    const user = await super.getUser(id);
    if (user) {
      await redisCache.setJSON(cacheKey, user, this.CACHE_TTL);
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Try cache first
    const cacheKey = this.userByUsernameCacheKey(username);
    const cached = await redisCache.getJSON<User>(cacheKey);
    if (cached) return cached;
    
    const user = await super.getUserByUsername(username);
    if (user) {
      await redisCache.setJSON(cacheKey, user, this.CACHE_TTL);
      await redisCache.setJSON(this.userCacheKey(user.id), user, this.CACHE_TTL);
    }
    return user;
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    // Try cache first
    const cacheKey = this.userBySpotifyIdCacheKey(spotifyId);
    const cached = await redisCache.getJSON<User>(cacheKey);
    if (cached) return cached;
    
    const user = await super.getUserBySpotifyId(spotifyId);
    if (user) {
      await redisCache.setJSON(cacheKey, user, this.CACHE_TTL);
      await redisCache.setJSON(this.userCacheKey(user.id), user, this.CACHE_TTL);
      if (user.username) {
        await redisCache.setJSON(this.userByUsernameCacheKey(user.username), user, this.CACHE_TTL);
      }
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await super.createUser(insertUser);
    
    // Cache the new user
    await redisCache.setJSON(this.userCacheKey(user.id), user, this.CACHE_TTL);
    if (user.username) {
      await redisCache.setJSON(this.userByUsernameCacheKey(user.username), user, this.CACHE_TTL);
    }
    if (user.spotifyId) {
      await redisCache.setJSON(this.userBySpotifyIdCacheKey(user.spotifyId), user, this.CACHE_TTL);
    }
    
    return user;
  }

  async updateUser(updatedUser: User): Promise<User> {
    const user = await super.updateUser(updatedUser);
    
    // Update cache
    await redisCache.setJSON(this.userCacheKey(user.id), user, this.CACHE_TTL);
    if (user.username) {
      await redisCache.setJSON(this.userByUsernameCacheKey(user.username), user, this.CACHE_TTL);
    }
    if (user.spotifyId) {
      await redisCache.setJSON(this.userBySpotifyIdCacheKey(user.spotifyId), user, this.CACHE_TTL);
    }
    
    return user;
  }

  async saveUserStats(userStats: InsertUserStats): Promise<UserStatsRecord> {
    const stats = await super.saveUserStats(userStats);
    
    // Cache the result
    await redisCache.setJSON(this.userStatsCacheKey(userStats.userId), stats, this.CACHE_TTL);
    
    return stats;
  }

  async getUserStats(userId: number): Promise<UserStatsRecord | undefined> {
    // Try cache first
    const cacheKey = this.userStatsCacheKey(userId);
    const cached = await redisCache.getJSON<UserStatsRecord>(cacheKey);
    if (cached) return cached;
    
    const stats = await super.getUserStats(userId);
    if (stats) {
      await redisCache.setJSON(cacheKey, stats, this.CACHE_TTL);
    }
    return stats;
  }

  async saveUserRecommendations(recommendations: InsertUserRecommendations): Promise<UserRecommendationsRecord> {
    const recs = await super.saveUserRecommendations(recommendations);
    
    // Cache the result
    await redisCache.setJSON(this.userRecommendationsCacheKey(recommendations.userId), recs, this.CACHE_TTL);
    
    return recs;
  }

  async getUserRecommendations(userId: number): Promise<UserRecommendationsRecord | undefined> {
    // Try cache first
    const cacheKey = this.userRecommendationsCacheKey(userId);
    const cached = await redisCache.getJSON<UserRecommendationsRecord>(cacheKey);
    if (cached) return cached;
    
    const recs = await super.getUserRecommendations(userId);
    if (recs) {
      await redisCache.setJSON(cacheKey, recs, this.CACHE_TTL);
    }
    return recs;
  }
}

// Use hybrid storage with Redis caching over in-memory storage
export const storage = new HybridStorage();
