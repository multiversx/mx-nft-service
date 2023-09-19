import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisKeyValueDataloaderHandler } from 'src/modules/common/redis-key-value-dataloader.handler';
import { RedisValue } from 'src/modules/common/redis-value.dto';

@Injectable()
export class AssetsCollectionsRedisHandler extends RedisKeyValueDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'asset_collection');
  }

  mapValues(returnValues: { key: string; value: any }[], assetsIdentifiers: { [key: string]: any[] }) {
    let response: RedisValue[] = [];
    const finalNfts = [];
    for (const item of returnValues) {
      if (item.value === null) {
        item.value = assetsIdentifiers[item.key] ? assetsIdentifiers[item.key] : null;

        finalNfts.push(item);
      }
    }

    response = [...response, new RedisValue({ values: finalNfts, ttl: Constants.oneDay() })];
    return response;
  }
}
