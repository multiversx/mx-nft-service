import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getRepository } from 'typeorm';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions/auction.entity';

@Injectable({
  scope: Scope.Operation,
})
export class AssetAuctionsCountProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.getAuctionsCountForIdentifiers(keys),
    { cache: false },
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getAssetAuctionsCount(identifier: string): Promise<any> {
    const cacheKey = this.getAssetAuctionsCountCacheKey(identifier);
    const getLikesCount = () => this.dataLoader.load(identifier);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getLikesCount,
      cacheConfig.followersttl,
    );
  }

  async clearKey(identifier: string): Promise<any> {
    await this.redisCacheService.del(
      this.redisClient,
      this.getAssetAuctionsCountCacheKey(identifier),
    );
    return this.dataLoader.clear(identifier);
  }

  async clearAll(): Promise<void> {
    this.dataLoader.clearAll();
  }

  private getAuctionsCountForIdentifiers = async (identifiers: string[]) => {
    const cacheKeys = this.getAssetsAuctionsCountCacheKeys(identifiers);
    let [keys, values] = [[], []];
    const getLikes = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getLikes.includes(null)) {
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
      keys = identifiers.map((i) => this.getAssetAuctionsCountCacheKey(i));
      values = identifiers?.map((identifier) =>
        assetsIdentifiers[identifier]
          ? assetsIdentifiers[identifier]
          : {
              identifier: identifier,
              auctionsCount: 0,
            },
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return identifiers?.map((identifier) => assetsIdentifiers[identifier]);
    }
  };

  private getAssetsAuctionsCountCacheKeys(identifiers: string[]) {
    return identifiers.map((id) => this.getAssetAuctionsCountCacheKey(id));
  }

  private getAssetAuctionsCountCacheKey(identifier: string) {
    return generateCacheKeyFromParams('assetAuctionsCount', identifier);
  }
}
