import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { getLowestAuctionForIdentifiersAndMarketplace } from 'src/db/auctions/sql.queries';
import { DateUtils } from 'src/utils/date-utils';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { AuctionEntity } from 'src/db/auctions';
import { LowestAuctionForMarketplaceRedisHandler } from './lowest-auctions-for-marketplace.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class LowestAuctionForMarketplaceProvider extends BaseProvider<string> {
  constructor(
    lowestAuctionProviderRedisHandler: LowestAuctionForMarketplaceRedisHandler,
  ) {
    super(
      lowestAuctionProviderRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getLowestAuctionForIdentifiersAndMarketplace(
        identifiers.map((value) => value.split('_')[0]),
        identifiers[0].split('_')[1],
      ),
    );
    return auctions?.groupBy((auction) => auction.identifierKey);
  }
}
