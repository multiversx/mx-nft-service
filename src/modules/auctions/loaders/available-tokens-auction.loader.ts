import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AvailableTokensForAuctionRedisHandler } from './available-tokens-auctions.redis-handler';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class AvailableTokensForAuctionProvider extends BaseProvider<number> {
  constructor(
    availableTokensForAuctionRedisHandler: AvailableTokensForAuctionRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      availableTokensForAuctionRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionIds: number[]) {
    const auctions =
      await this.auctionsServiceDb.getAvailableTokensForAuctionIds(auctionIds);
    return auctions?.groupBy(
      (auction: { auctionId: any }) => auction.auctionId,
    );
  }
}
