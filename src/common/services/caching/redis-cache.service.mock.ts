import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisCacheServiceMock {
  async getOrSet<T>(
    _client: string,
    _: string,
    createValueFunc: () => T | Promise<T>,
  ): Promise<T> {
    return await createValueFunc();
  }
  getClient(_clientName: string): Redis.Redis {
    return;
  }
  set(): Promise<void> {
    return Promise.resolve();
  }

  get(): Promise<unknown> {
    return Promise.resolve(null);
  }
}
