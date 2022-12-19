import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { RedisValueDataloaderHandler } from 'src/modules/common/redis-value-dataloader.handler';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class AssetLikesProviderRedisHandler extends RedisValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'assetLikesCount', localRedisCacheService);
  }

  mapValues(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers?.map((identifier) =>
      assetsIdentifiers[identifier]
        ? parseInt(assetsIdentifiers[identifier][0].likesCount)
        : 0,
    );
  }
}
