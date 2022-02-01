import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { getAvailableTokensbyAuctionIds } from '../auctions/sql.queries';
import { AuctionEntity } from '../auctions';
import { BaseProvider } from 'src/modules/assets/base.loader';
import { Injectable } from '@nestjs/common';
import { AvailableTokensForAuctionRedisHandler } from './available-tokens-auctions.redis-handler';

@Injectable()
export class AvailableTokensForAuctionProvider extends BaseProvider<number> {
  constructor(
    availableTokensForAuctionRedisHandler: AvailableTokensForAuctionRedisHandler,
  ) {
    super(
      availableTokensForAuctionRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getData(auctionIds: number[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getAvailableTokensbyAuctionIds(auctionIds),
    );
    return auctions?.groupBy((auction) => auction.auctionId);
  }
}
