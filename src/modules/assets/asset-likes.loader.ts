import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getRepository } from 'typeorm';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { cacheConfig } from 'src/config';
import { AssetLikeEntity } from 'src/db/assets/assets-likes.entity';

@Injectable({
  scope: Scope.Operation,
})
export class AssetLikesProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.batchAssetLikes(keys),
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getAssetLikesCount(identifier: string): Promise<any> {
    const cacheKey = this.getAuctionCacheKey(identifier);
    const getAuctions = () => this.dataLoader.load(identifier);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.followersttl,
    );
  }

  async clearKey(identifier: string): Promise<any> {
    return this.dataLoader.clear(identifier);
  }

  async clearAll(): Promise<any> {
    return this.dataLoader.clearAll();
  }

  private batchAssetLikes = async (identifiers: string[]) => {
    const cacheKeys = this.getAuctionsCacheKey(identifiers);
    let [keys, values] = [[], []];
    const getLikes = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getLikes.includes(null)) {
      const assetLikes = await getRepository(AssetLikeEntity)
        .createQueryBuilder('al')
        .select('al.identifier as identifier')
        .addSelect('COUNT(al.identifier) as likesCount')
        .where(
          `al.identifier IN(${identifiers.map((value) => `'${value}'`)})`,
          {
            identifiers: identifiers,
          },
        )
        .groupBy('al.identifier')
        .execute();
      const assetsIdentifiers: { [key: string]: any[] } = {};
      assetLikes.forEach(
        (asset: { identifier: string; likesCount: string }) => {
          if (!assetsIdentifiers[asset.identifier]) {
            assetsIdentifiers[asset.identifier] = [
              {
                identifier: asset.identifier,
                likesCount: parseInt(asset.likesCount),
              },
            ];
          } else {
            assetsIdentifiers[asset.identifier].push(asset);
          }
          keys = [...keys, this.getAuctionCacheKey(asset.identifier)];
          values = [
            ...values,
            {
              identifier: asset.identifier,
              likesCount: parseInt(asset.likesCount),
            },
          ];
        },
      );
      const likes = await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return identifiers?.map((identifier) => assetsIdentifiers[identifier]);
    }
  };

  private getAuctionsCacheKey(identifiers: string[]) {
    return identifiers.map((id) => this.getAuctionCacheKey(id));
  }
  private getAuctionCacheKey(identifier: string) {
    return generateCacheKeyFromParams('assetLikesCount', identifier);
  }
}
