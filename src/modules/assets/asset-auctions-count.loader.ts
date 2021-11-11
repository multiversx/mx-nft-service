import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { BaseProvider } from './base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AssetAuctionsCountProvider extends BaseProvider<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'assetAuctionsCount',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  mapValuesForRedis(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers?.map((identifier) =>
      assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier]
        : [
            {
              identifier: identifier,
              auctionsCount: 0,
            },
          ],
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const auctions = await getRepository(AuctionEntity)
      .createQueryBuilder('a')
      .select('a.identifier as identifier')
      .addSelect('COUNT(a.identifier) as auctionsCount')
      .where(
        `a.identifier IN(${identifiers.map(
          (value) => `'${value}'`,
        )}) and a.status='Running'`,
        {
          identifiers: identifiers,
        },
      )
      .groupBy('a.identifier')
      .execute();

    return auctions?.groupBy((asset) => asset.identifier);
  }
}
