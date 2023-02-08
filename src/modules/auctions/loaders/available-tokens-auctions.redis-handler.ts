import { Injectable } from '@nestjs/common';
import { Constants, RedisCacheService } from '@multiversx/sdk-nestjs';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class AvailableTokensForAuctionRedisHandler extends RedisKeyValueDataloaderHandler<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'auction_available_tokens');
  }

  mapValues(
    returnValues: { key: number; value: any }[],
    auctionsIds: { [key: string]: any[] },
  ) {
    const redisValues = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value =
          auctionsIds && auctionsIds[item.key]
            ? auctionsIds[item.key][0]?.availableTokens
            : null;
        redisValues.push(item);
      }
    }

    return [new RedisValue({ values: redisValues, ttl: Constants.oneWeek() })];
  }
}
