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
    async (keys: string[]) => await this.getAuctions(keys),
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

  private getAuctions = async (identifiers: string[]) => {
    const cacheKey = this.getAuctionsCacheKey(identifiers)[0];
    const getAuctions = () => this.batchAssetLikes(identifiers);
    return this.batchAssetLikes(identifiers);
  };

  private batchAssetLikes = async (identifiers: string[]) => {
    const cacheKeys = this.getAuctionsCacheKey(identifiers);
    const getLikes = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getLikes.includes(null)) {
      const assetLikes = await getRepository(AssetLikeEntity)
        .createQueryBuilder('assetLikes')
        .where('identifier IN(:...identifiers)', {
          identifiers: identifiers,
        })
        .getMany();
      const assetsIdentifiers: { [key: string]: AssetLikeEntity[] } = {};

      assetLikes.forEach((asset) => {
        if (!assetsIdentifiers[asset.identifier]) {
          assetsIdentifiers[asset.identifier] = [asset];
        } else {
          assetsIdentifiers[asset.identifier].push(asset);
        }
      });
    }
    const assetLikes = await getRepository(AssetLikeEntity)
      .createQueryBuilder('assetLikes')
      .where('identifier IN(:...identifiers)', {
        identifiers: identifiers,
      })
      .getMany();
    const assetsIdentifiers: { [key: string]: AssetLikeEntity[] } = {};

    assetLikes.forEach((asset) => {
      if (!assetsIdentifiers[asset.identifier]) {
        assetsIdentifiers[asset.identifier] = [asset];
      } else {
        assetsIdentifiers[asset.identifier].push(asset);
      }
    });

    return identifiers?.map((identifier) => assetsIdentifiers[identifier]);
  };

  private getAuctionsCacheKey(identifiers: string[]) {
    return identifiers.map((id) => this.getAuctionCacheKey(id));
  }
  private getAuctionCacheKey(identifier: string) {
    return generateCacheKeyFromParams('assetLikesCount', identifier);
  }
}
