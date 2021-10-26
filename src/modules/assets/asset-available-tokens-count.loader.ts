import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getRepository } from 'typeorm';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { getAvailableTokensScripts } from 'src/db/auctions/sql.queries';

@Injectable({
  scope: Scope.Operation,
})
export class AssetAvailableTokensCountProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) =>
      await this.getAvailableTokensCountForIdentifiers(keys),
    { cache: false },
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getAvailableTokensCount(identifier: string): Promise<any> {
    const cacheKey = this.getAvailableTokensCountCacheKey(identifier);
    const getAvailableTokensCount = () => this.dataLoader.load(identifier);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAvailableTokensCount,
      30,
    );
  }

  async clearKey(identifier: string): Promise<any> {
    await this.redisCacheService.del(
      this.redisClient,
      this.getAvailableTokensCountCacheKey(identifier),
    );
    return this.dataLoader.clear(identifier);
  }

  async clearAll(): Promise<void> {
    this.dataLoader.clearAll();
  }

  private getAvailableTokensCountForIdentifiers = async (
    identifiers: string[],
  ) => {
    const cacheKeys = this.getAvailableTokensCountCacheKeys(identifiers);
    let [keys, values] = [[], []];
    const getLikes = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getLikes.includes(null)) {
      const assetAuctions = await getRepository(AuctionEntity).query(
        getAvailableTokensScripts(identifiers),
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
      keys = identifiers.map((i) => this.getAvailableTokensCountCacheKey(i));
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

  private getAvailableTokensCountCacheKeys(identifiers: string[]) {
    return identifiers.map((id) => this.getAvailableTokensCountCacheKey(id));
  }

  private getAvailableTokensCountCacheKey(identifier: string) {
    return generateCacheKeyFromParams('availableTokensCount', identifier);
  }
}
