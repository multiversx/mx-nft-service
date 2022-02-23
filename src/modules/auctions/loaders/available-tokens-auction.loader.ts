import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { getAvailableTokensbyAuctionIds } from '../../../db/auctions/sql.queries';
import { AuctionEntity } from '../../../db/auctions';
import { Injectable, Scope } from '@nestjs/common';
import { AvailableTokensForAuctionRedisHandler } from './available-tokens-auctions.redis-handler';
import { BaseProvider } from 'src/modules/common/base.loader';

@Injectable({
  scope: Scope.REQUEST,
})
export class AvailableTokensForAuctionProvider extends BaseProvider<number> {
  constructor(
    availableTokensForAuctionRedisHandler: AvailableTokensForAuctionRedisHandler,
  ) {
    super(
      availableTokensForAuctionRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionIds: number[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getAvailableTokensbyAuctionIds(auctionIds),
    );
    return auctions?.groupBy((auction) => auction.auctionId);
  }
}
