import DataLoader = require('dataloader');
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { FeaturedMarketplaceRedisHandler } from './featured-marketplace.redis-handler';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';

@Injectable({
  scope: Scope.REQUEST,
})
export class FeaturedMarketplaceProvider extends BaseProvider<string> {
  constructor(
    featuredMarketplaceRedisHandler: FeaturedMarketplaceRedisHandler,
    private marketplaceRepository: MarketplaceRepository,
  ) {
    super(
      featuredMarketplaceRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(addresses: string[]) {
    const featuredMarketplace =
      await this.marketplaceRepository.getMarketplacesByAddresses(addresses);
    return featuredMarketplace?.groupBy((asset) => asset.address);
  }
}
