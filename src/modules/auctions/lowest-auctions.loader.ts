import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { BaseProvider } from '../common/base.loader';
import { getLowestAuctionForIdentifiers } from 'src/db/auctions/sql.queries';
import { DateUtils } from 'src/utils/date-utils';
import { LowestAuctionRedisHandler } from './lowest-auctions.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class LowestAuctionProvider extends BaseProvider<string> {
  constructor(lowestAuctionProviderRedisHandler: LowestAuctionRedisHandler) {
    super(
      lowestAuctionProviderRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const endDate = DateUtils.getCurrentTimestampPlus(12);
    const auctions = await getRepository(AuctionEntity).query(
      getLowestAuctionForIdentifiers(endDate, identifiers),
    );

    return auctions?.groupBy((auction) => auction.identifier);
  }
}
