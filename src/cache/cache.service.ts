import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import NodeCache from 'node-cache';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private memory: NodeCache;

  constructor(private readonly config: ConfigService) {
    this.memory = new NodeCache();
  }

  async onModuleInit() {
    try {
      const client = new Redis({
        host: this.config.get<string>('app.redisHost'),
        port: this.config.get<number>('app.redisPort'),
        connectTimeout: 3000,
        lazyConnect: true,
      });
      await client.connect();
      this.redis = client;
      this.logger.log('Connected to Redis');
    } catch {
      this.logger.warn('Redis unavailable — using in-memory cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      const val = await this.redis.get(key);
      return val ? JSON.parse(val) : null;
    }
    return this.memory.get<T>(key) ?? null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      this.memory.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
    } else {
      this.memory.del(key);
    }
  }
}
