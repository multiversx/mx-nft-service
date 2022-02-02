import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from './redis-dataloader.handler';

@Injectable()
export class IsAssetLikedRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'isAssetLiked');
  }

  mapValues(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers?.map((identifier) =>
      assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier]
        : [
            {
              identifier: identifier,
              liked: 0,
            },
          ],
    );
  }
}
