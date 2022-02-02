import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { Asset } from './models';
import { RedisDataloaderHandler } from './redis-dataloader.handler';

@Injectable()
export class AssetstRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset');
  }

  mapValues(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) => {
      return Asset.fromNft(assetsIdentifiers[identifier][0]);
    });
  }
}
