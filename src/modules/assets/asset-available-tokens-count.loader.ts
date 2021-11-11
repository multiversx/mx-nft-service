import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { getAvailableTokensScriptsByIdentifiers } from 'src/db/auctions/sql.queries';
import { BaseProvider } from './base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AssetAvailableTokensCountProvider extends BaseProvider<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'availableTokensCount',
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
              count: 0,
            },
          ],
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const availableTokens = await getRepository(AuctionEntity).query(
      getAvailableTokensScriptsByIdentifiers(identifiers),
    );

    return availableTokens?.groupBy((auction) => auction.identifier);
  }
}
