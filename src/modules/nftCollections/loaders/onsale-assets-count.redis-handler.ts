import { RedisCacheService } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { LocalRedisCacheService } from 'src/common';
import { AuctionEntity } from 'src/db/auctions';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class OnSaleAssetsCountForCollectionRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(
    redisCacheService: RedisCacheService,
    localRedisCacheService: LocalRedisCacheService,
  ) {
    super(redisCacheService, 'on_sale_assets_count', localRedisCacheService);
  }

  mapValues(
    returnValues: { key: string; value: any }[],
    auctionsIdentifiers: { [key: string]: AuctionEntity[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = auctionsIdentifiers[item.key]
          ? auctionsIdentifiers[item.key][0]
          : 0;
        redisValues.push(item);
      }
    }

    return [
      new RedisValue({
        values: redisValues,
        ttl: TimeConstants.oneHour,
      }),
    ];
  }
}
