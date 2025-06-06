import { 
  users, 
  generatedTracks, 
  type User, 
  type InsertUser, 
  type GeneratedTrack, 
  type InsertGeneratedTrack 
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(user: User): Promise<User>;
  createGeneratedTrack(track: InsertGeneratedTrack): Promise<GeneratedTrack>;
  getGeneratedTracksByUserId(userId: number): Promise<GeneratedTrack[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private generatedTracks: Map<number, GeneratedTrack>;
  private userIdCounter: number;
  private trackIdCounter: number;

  constructor() {
    this.users = new Map();
    this.generatedTracks = new Map();
    this.userIdCounter = 1;
    this.trackIdCounter = 1;
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
      avatarUrl: insertUser.avatarUrl || null
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
}

export const storage = new MemStorage();
