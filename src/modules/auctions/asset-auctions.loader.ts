import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { RedisCacheService } from 'src/common';
import { getAuctionsForAsset } from 'src/db/auctions/sql.queries';
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
    const auctions = await getRepository(AuctionEntity).query(
      getAuctionsForAsset(
        identifiers.map((value) => value.split('_')[0]),
        parseInt(identifiers[0].split('_')[1]),
        parseInt(identifiers[0].split('_')[2]),
      ),
    );
    return auctions?.groupBy((auction) => auction.batchKey);
  }
}
