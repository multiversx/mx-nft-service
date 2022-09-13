import DataLoader = require('dataloader');
import { LowestAuctionRedisHandler } from './lowest-auctions.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class LowestAuctionProvider extends BaseProvider<string> {
  constructor(
    lowestAuctionProviderRedisHandler: LowestAuctionRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      lowestAuctionProviderRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions =
      await this.auctionsServiceDb.getLowestAuctionForIdentifiers(identifiers);

    return auctions?.groupBy((auction) => auction.identifier);
  }
}
