import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class RedisCacheService {
  DEFAULT_TTL = 300;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async get(key: string): Promise<any> {
    try {
      return await this.cache.get(key);
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to get from redis cache.',
        {
          path: 'redis-cache.service.get',
          exception: err.toString(),
          cacheKey: key,
        },
      );
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    if (isNil(value)) {
      return;
    }
    try {
      await this.cache.set(key, value, { ttl });
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to set in redis cache.',
        {
          path: 'redis-cache.service.set',
          exception: err.toString(),
          cacheKey: key,
        },
      );
      return;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to delete from redis cache.',
        {
          path: 'redis-cache.service.del',
          exception: err.toString(),
          cacheKey: key,
        },
      );
    }
  }

  async delKeysContaining(key: string): Promise<void> {
    try {
      const keys = await this.cache.store.keys();
      for await (const item of keys) {
        if (item.includes(key)) {
          await this.cache.del(item);
        }
      }
    } catch (err) {
      this.logger.error(
        'An error occurred while trying to delete all keys containing string from redis cache.',
        {
          path: 'redis-cache.service.delKeysContaining',
          exception: err.toString(),
          cacheKey: key,
        },
      );
    }
  }

  async getOrSet(
    key: string,
    createValueFunc: () => any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<any> {
    const cachedData = await this.get(key);
    if (!isNil(cachedData)) {
      return cachedData;
    }

    const internalCreateValueFunc = this.buildInternalCreateValueFunc(
      key,
      createValueFunc,
    );
    const value = await internalCreateValueFunc();
    await this.set(key, value, ttl);
    return value;
  }

  async setOrUpdate(
    key: string,
    createValueFunc: () => any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<any> {
    const internalCreateValueFunc = this.buildInternalCreateValueFunc(
      key,
      createValueFunc,
    );
    const value = await internalCreateValueFunc();
    await this.set(key, value, ttl);
    return value;
  }

  private buildInternalCreateValueFunc(
    key: string,
    createValueFunc: () => any,
  ): () => Promise<any> {
    return async () => {
      try {
        let data = createValueFunc();
        if (data instanceof Promise) {
          data = await data;
        }
        return data;
      } catch (err) {
        this.logger.error(`An error occurred while trying to load value.`, {
          path: 'redis-cache.service.createValueFunc',
          exception: err.toString(),
          key,
        });
        return null;
      }
    };
  }
}
