import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: CacheStore) {}

  async get(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.cacheManager.set(key, value, 3600 * 24);
  }
}
