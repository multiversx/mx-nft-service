import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class CachingServiceMock {
  private DEFAULT_TTL = 300;
  async getOrSetCache<T>(
    _client: string,
    _: string,
    createValueFunc: () => T | Promise<T>,
    _remoteTtl: number = this.DEFAULT_TTL,
    _localTtl: number | undefined = undefined,
    _forceRefresh: boolean = false,
  ): Promise<T> {
    return await createValueFunc();
  }
  getClient(_clientName: string): Redis.Redis {
    return;
  }

  public async setCache<T>(
    client: Redis.Redis,
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    return Promise.resolve(value);
  }

  async deleteInCache(client: Redis.Redis, key: string): Promise<void> {}

  pendingPromises: { [key: string]: Promise<any> } = {};

  async deleteInCacheLocal(key: string) {}

  async refreshCacheLocal<T>(
    redisClient,
    key: string,
    ttl: number = TimeConstants.oneHour,
  ): Promise<T | undefined> {
    return Promise.resolve(undefined);
  }
}
