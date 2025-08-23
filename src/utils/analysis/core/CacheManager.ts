import { openDB, IDBPDatabase } from 'idb';
import { createError } from '@/utils/core/error';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CacheOptions {
  duration?: number; // Cache duration in milliseconds
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
}

export class CacheManager {
  private static instance: CacheManager;
  private db: IDBPDatabase | null = null;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await openDB('dataanalyzer-cache', 1, {
        upgrade(db) {
          db.createObjectStore('cache');
        }
      });
    } catch (error) {
      console.error('Failed to initialize cache database:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        return memoryEntry.data;
      }

      // Check IndexedDB
      if (this.db) {
        const entry = await this.db.get('cache', key) as CacheEntry<T> | undefined;
        if (entry && !this.isExpired(entry)) {
          // Update memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      }

      return null;
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        metadata: {
          priority: options.priority || 'normal',
          tags: options.tags || []
        }
      };

      // Update memory cache
      this.memoryCache.set(key, entry);

      // Update IndexedDB
      if (this.db) {
        await this.db.put('cache', entry, key);
      }

      // Clean up old entries periodically
      this.cleanup();
    } catch (error) {
      throw createError('SYSTEM_FAILURE', 'Failed to cache data');
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.db) {
      await this.db.delete('cache', key);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    // Clear memory cache entries with matching tag
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.metadata?.tags?.includes(tag)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear IndexedDB entries with matching tag
    if (this.db) {
      const keys = await this.db.getAllKeys('cache');
      for (const key of keys) {
        const entry = await this.db.get('cache', key) as CacheEntry<any>;
        if (entry.metadata?.tags?.includes(tag)) {
          await this.db.delete('cache', key);
        }
      }
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > (this.DEFAULT_DURATION);
  }

  private async cleanup(): Promise<void> {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean IndexedDB
    if (this.db) {
      const keys = await this.db.getAllKeys('cache');
      for (const key of keys) {
        const entry = await this.db.get('cache', key) as CacheEntry<any>;
        if (this.isExpired(entry)) {
          await this.db.delete('cache', key);
        }
      }
    }
  }
}