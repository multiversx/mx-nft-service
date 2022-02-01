import { Injectable } from '@nestjs/common';
import DataLoader = require('dataloader');
import { ElrondDataService } from 'src/common';
import { BaseProvider } from 'src/modules/assets/base.loader';
import { UsdPriceRedisHandler } from './usd-price.redis-handler';

@Injectable()
export class UsdPriceLoader extends BaseProvider<number> {
  constructor(
    usdPriceLoaderRedisHandler: UsdPriceRedisHandler,
    private dataService: ElrondDataService,
  ) {
    super(
      usdPriceLoaderRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getData(timestamps: number[]) {
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
}
