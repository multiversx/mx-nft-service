import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class AssetsCollectionsForOwnerRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'asset_collection_owner', localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    let response: RedisValue[] = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key]
          ? assetsIdentifiers[item.key]
          : null;

        finalNfts.push(item);
      }
    }

    response = [
      ...response,
      new RedisValue({ values: finalNfts, ttl: 5 * TimeConstants.oneMinute }),
    ];
    return response;
  }
}
