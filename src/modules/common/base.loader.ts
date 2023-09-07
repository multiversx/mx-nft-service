import { Injectable, Scope } from '@nestjs/common';
import { RedisKeyValueDataloaderHandler } from './redis-key-value-dataloader.handler';
import { RedisValueDataloaderHandler } from './redis-value-dataloader.handler';

@Injectable({ scope: Scope.REQUEST })
export abstract class BaseProvider<T> {
  constructor(
    private redisHandler: RedisKeyValueDataloaderHandler<T> | RedisValueDataloaderHandler<T>,
    private dataLoader: {
      load: (arg0: T) => any;
      clear: (arg0: T) => any;
      clearAll: () => any;
    },
  ) {}

  abstract getData(identifiers: T[]): Promise<any[]>;

  async load(key: T): Promise<{ key: T; value: any }> {
    return this.dataLoader.load(key);
  }

  async clearKey(key: T): Promise<any> {
    this.redisHandler.clearKey(key);
    return this.dataLoader.clear(key);
  }

  async clearAll(): Promise<any> {
    return this.dataLoader.clearAll();
  }

  batchLoad = async (keys: T[]) => {
    const dataKeys = () => this.getData(keys);
    return this.redisHandler.batchLoad(keys, dataKeys);
  };
}
