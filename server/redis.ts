import { createClient } from 'redis';

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

// Initialize Redis connection with silent error handling
redis.on('error', () => {
  // Silent error handling - Redis is optional
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

// Track Redis connection status
let isRedisConnected = false;

// Connect to Redis
export async function connectRedis() {
  try {
    await redis.connect();
    isRedisConnected = true;
    console.log('Redis connection established');
  } catch (error) {
    console.log('Redis not available, continuing without caching');
    isRedisConnected = false;
    // Don't throw error to allow app to continue without Redis
  }
}

// Redis utility functions with fallback when Redis is unavailable
export const redisCache = {
  // Get value from cache
  async get(key: string): Promise<string | null> {
    if (!isRedisConnected) return null;
    try {
      return await redis.get(key);
    } catch (error) {
      return null;
    }
  },

  // Set value in cache
  async set(key: string, value: string, expireInSeconds?: number): Promise<boolean> {
    if (!isRedisConnected) return false;
    try {
      if (expireInSeconds) {
        await redis.setEx(key, expireInSeconds, value);
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  // Delete key from cache
  async delete(key: string): Promise<boolean> {
    if (!isRedisConnected) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!isRedisConnected) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  },

  // Set JSON object in cache
  async setJSON(key: string, value: any, expireInSeconds?: number): Promise<boolean> {
    if (!isRedisConnected) return false;
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, expireInSeconds);
    } catch (error) {
      return false;
    }
  },

  // Get JSON object from cache
  async getJSON<T>(key: string): Promise<T | null> {
    if (!isRedisConnected) return null;
    try {
      const jsonString = await this.get(key);
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      return null;
    }
  }
};