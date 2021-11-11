import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { RedisCacheService } from 'src/common';
import { getDefaultAuctionsQueryForIdentifiers } from 'src/db/auctions/sql.queries';
import { DateUtils } from 'src/utils/date-utils';
import { BaseProvider } from '../assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionsForAssetProvider extends BaseProvider<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'default_auctions',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
      30,
    );
  }

  mapValuesForRedis(
    identifiers: string[],
    auctionsIdentifiers: { [key: string]: AuctionEntity[] },
  ) {
    return identifiers?.map((identifier) =>
      auctionsIdentifiers[identifier] ? auctionsIdentifiers[identifier] : [],
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const endDate = DateUtils.getCurrentTimestampPlus(12);
    const auctions = await getRepository(AuctionEntity).query(
      getDefaultAuctionsQueryForIdentifiers(endDate, identifiers),
    );

    return auctions?.groupBy((auction) => auction.identifier);
  }
}
