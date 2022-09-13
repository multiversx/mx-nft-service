import DataLoader = require('dataloader');
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { LowestAuctionForMarketplaceRedisHandler } from './lowest-auctions-for-marketplace.redis-handler';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class LowestAuctionForMarketplaceProvider extends BaseProvider<string> {
  constructor(
    lowestAuctionProviderRedisHandler: LowestAuctionForMarketplaceRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      lowestAuctionProviderRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions =
      await this.auctionsServiceDb.getLowestAuctionForIdentifiersAndMarketplace(
        identifiers,
      );
    return auctions?.groupBy(
      (auction: { identifierKey: any }) => auction.identifierKey,
    );
  }
}
