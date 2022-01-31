import DataLoader = require('dataloader');
import { ElrondDataService, RedisCacheService } from 'src/common';
import { BaseProvider } from 'src/modules/assets/base.loader';
import { cacheConfig } from 'src/config';
import { DateUtils } from 'src/utils/date-utils';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class UsdPriceLoader extends BaseProvider<number> {
  constructor(
    redisCacheService: RedisCacheService,
    private dataService: ElrondDataService,
  ) {
    super(
      'priceUSD',
      redisCacheService,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
      cacheConfig.followersttl,
    );
  }

  async getDataFromDb(timestamps: number[]) {
    const response = await Promise.all(
      timestamps.map(async (timestamp) => {
        return {
          timestamp,
          value: await this.dataService.getQuotesHistoricalTimestamp(timestamp),
        };
      }),
    );
    return response?.groupBy((asset) => asset.timestamp);
  }

  mapValuesForRedis(
    identifiers: number[],
    assetsIdentifiers: { [key: number]: any[] },
  ) {
    return identifiers.map((identifier) =>
      assetsIdentifiers && assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier][0]
        : null,
    );
  }

  getCacheKey(key: number) {
    return generateCacheKeyFromParams(
      'priceUSD',
      DateUtils.getDateFromTimestampWithoutTime(key),
    );
  }
}
