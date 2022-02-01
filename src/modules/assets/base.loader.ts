import { Injectable } from '@nestjs/common';
import { RedisDataloaderHandler } from './redis-dataloader.handler';

@Injectable()
export abstract class BaseProvider<T> {
  constructor(
    private redisHandler: RedisDataloaderHandler<T>,
    private dataLoader: {
      load: (arg0: T) => any;
      clear: (arg0: T) => any;
      clearAll: () => any;
    },
  ) {}

  abstract getData(identifiers: T[]): Promise<any[]>;

  async load(key: T): Promise<any> {
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
