import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { MarketplaceRedisHandler } from './marketplace.redis-handler';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';

@Injectable({
  scope: Scope.REQUEST,
})
export class MarketplaceProvider extends BaseProvider<string> {
  constructor(
    redisHandler: MarketplaceRedisHandler,
    private marketplacesRepository: MarketplaceRepository,
  ) {
    super(
      redisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(marketplaceKeys: string[]) {
    const marketplaces =
      await this.marketplacesRepository.getMarketplacesByKeys(marketplaceKeys);
    return marketplaces?.groupBy((marketplace) => marketplace.key);
  }
}
