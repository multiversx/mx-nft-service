import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { MarketplaceRedisHandler } from './marketplace.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class MarketplaceProvider extends BaseProvider<string> {
  constructor(redisHandler: MarketplaceRedisHandler, private persistenceService: PersistenceService) {
    super(redisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(marketplaceKeys: string[]) {
    const marketplaces = await this.persistenceService.getMarketplacesByKeys(marketplaceKeys);
    return marketplaces?.groupBy((marketplace) => marketplace.key);
  }
}
