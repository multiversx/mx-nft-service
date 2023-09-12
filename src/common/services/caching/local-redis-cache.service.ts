import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable, Logger } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
@Injectable()
export class LocalRedisCacheService {
  constructor(private readonly logger: Logger, private readonly redisCacheService: RedisCacheService) {}

  async getOrSetWithDifferentTtl(key: string, createValueFunc: () => any): Promise<any> {
    const cachedData = await this.redisCacheService.get(key);
    if (!isNil(cachedData)) {
      return cachedData;
    }
    const value = await this.buildInternalCreateValueFunc(key, createValueFunc);
    await this.redisCacheService.set(key, value, value.ttl);

    return value;
  }

  private async buildInternalCreateValueFunc(key: string, createValueFunc: () => any): Promise<any> {
    try {
      let data = createValueFunc();
      if (data instanceof Promise) {
        data = await data;
      }
      return data;
    } catch (err) {
      this.logger.error(`An error occurred while trying to load value.`, {
        path: 'redis-cache.service.createValueFunc',
        exception: err,
        key,
      });
      return null;
    }
  }
}
