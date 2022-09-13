import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';
import { BaseProvider } from 'src/modules/common/base.loader';
import { AuctionsRedisHandler } from './auctions.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionProvider extends BaseProvider<number> {
  constructor(
    auctionsRedisHandler: AuctionsRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      auctionsRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionsIds: number[]) {
    const auctions = await this.auctionsServiceDb.getBulkAuctions(auctionsIds);
    return auctions?.groupBy((auction) => auction.id);
  }
}
