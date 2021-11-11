import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
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
      new DataLoader(
        async (keys: string[]) =>
          await this.getAuctionsCountForIdentifiers(keys),
        { cache: false },
      ),
    );
  }

  private getAuctionsCountForIdentifiers = async (identifiers: string[]) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [keys, values] = [cacheKeys, []];
    const getAuctionsCountFromCache =
      await this.redisCacheService.batchGetCache(this.redisClient, cacheKeys);
    if (getAuctionsCountFromCache.includes(null)) {
      const assetAuctions = await getRepository(AuctionEntity)
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
      const assetsIdentifiers: { [key: string]: any[] } = {};
      assetAuctions.forEach(
        (asset: { identifier: string; auctionsCount: string }) => {
          if (!assetsIdentifiers[asset.identifier]) {
            assetsIdentifiers[asset.identifier] = [
              {
                identifier: asset.identifier,
                auctionsCount: asset.auctionsCount,
              },
            ];
          } else {
            assetsIdentifiers[asset.identifier].push(asset);
          }
        },
      );
      values = identifiers?.map((identifier) =>
        assetsIdentifiers[identifier]
          ? assetsIdentifiers[identifier]
          : [
              {
                identifier: identifier,
                auctionsCount: 0,
              },
            ],
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return identifiers?.map((identifier) => assetsIdentifiers[identifier]);
    }
    return getAuctionsCountFromCache;
  };
}
