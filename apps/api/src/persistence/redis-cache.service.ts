import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private available = false;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      await this.client.connect();
      this.available = true;
    } catch {
      this.available = false;
      if (this.client) {
        this.client.disconnect();
        this.client = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  isAvailable() {
    return this.available;
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client || !this.available) {
      return null;
    }
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.client || !this.available) {
      return;
    }
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.available) {
      return;
    }
    await this.client.del(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!this.client || !this.available || keys.length === 0) {
      return;
    }
    await this.client.del(...keys);
  }
}
