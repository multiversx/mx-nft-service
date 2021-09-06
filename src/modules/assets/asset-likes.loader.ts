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
      cacheConfig.assetsRedisClientName,
    );
  }

  async getAssetLikesCount(identifier: string): Promise<any> {
    return await this.dataLoader.load(identifier);
  }

  private getAuctions = async (identifiers: string[]) => {
    const cacheKey = this.getAuctionsCacheKey(identifiers);
    const getAuctions = () => this.batchAssetLikes(identifiers);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.auctionsttl,
    );
  };

  private batchAssetLikes = async (identifiers: string[]) => {
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
    return generateCacheKeyFromParams('assetLikesCount', identifiers);
  }
}
