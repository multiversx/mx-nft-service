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
      new DataLoader(
        async (keys: string[]) =>
          await this.getAvailableTokensCountForIdentifiers(keys),
        { cache: false },
      ),
    );
  }

  private getAvailableTokensCountForIdentifiers = async (
    identifiers: string[],
  ) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [keys, values] = [cacheKeys, []];
    const getAvailableTokensCount = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getAvailableTokensCount.includes(null)) {
      const assetAuctions = await getRepository(AuctionEntity).query(
        getAvailableTokensScriptsByIdentifiers(identifiers),
      );

      const assetsIdentifiers: { [key: string]: any[] } = {};
      assetAuctions.forEach((asset: { identifier: string; count: string }) => {
        if (!assetsIdentifiers[asset.identifier]) {
          assetsIdentifiers[asset.identifier] = [
            {
              identifier: asset.identifier,
              count: asset.count,
            },
          ];
        } else {
          assetsIdentifiers[asset.identifier].push(asset);
        }
      });
      values = identifiers?.map((identifier) =>
        assetsIdentifiers[identifier]
          ? assetsIdentifiers[identifier]
          : [
              {
                identifier: identifier,
                count: 0,
              },
            ],
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        30,
      );
      return identifiers?.map((identifier) => assetsIdentifiers[identifier]);
    }
    return getAvailableTokensCount;
  };
}
