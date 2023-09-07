import DataLoader = require('dataloader');
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { LowestAuctionForMarketplaceRedisHandler } from './lowest-auctions-for-marketplace.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class LowestAuctionForMarketplaceProvider extends BaseProvider<string> {
  constructor(lowestAuctionProviderRedisHandler: LowestAuctionForMarketplaceRedisHandler, private persistenceService: PersistenceService) {
    super(lowestAuctionProviderRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const auctions = await this.persistenceService.getLowestAuctionForIdentifiersAndMarketplace(identifiers);
    return auctions?.groupBy((auction: { identifierKey: any }) => auction.identifierKey);
  }
}
