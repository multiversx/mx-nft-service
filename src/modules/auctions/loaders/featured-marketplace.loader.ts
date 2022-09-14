import DataLoader = require('dataloader');
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { FeaturedMarketplaceRedisHandler } from './featured-marketplace.redis-handler';
import { PersistenceService } from 'src/common/persistance/persistance.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class FeaturedMarketplaceProvider extends BaseProvider<string> {
  constructor(
    featuredMarketplaceRedisHandler: FeaturedMarketplaceRedisHandler,
    private persistanceService: PersistenceService,
  ) {
    super(
      featuredMarketplaceRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(addresses: string[]) {
    const featuredMarketplace =
      await this.persistanceService.getMarketplacesByAddresses(addresses);
    return featuredMarketplace?.groupBy((asset) => asset.address);
  }
}
