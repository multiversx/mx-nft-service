import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { RedisValueDataloaderHandler } from 'src/modules/common/redis-value-dataloader.handler';

@Injectable()
export class AssetLikesProviderRedisHandler extends RedisValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'assetLikesCount');
  }

  mapValues(identifiers: string[], assetsIdentifiers: { [key: string]: any[] }) {
    return identifiers?.map((identifier) => (assetsIdentifiers[identifier] ? parseInt(assetsIdentifiers[identifier][0].likesCount) : 0));
  }
}
