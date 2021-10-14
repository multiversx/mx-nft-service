import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { cacheConfig } from 'src/config';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionProvider {
  private dataLoader = new DataLoader(
    async (keys: number[]) => await this.getAuctions(keys),
    { cache: false },
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async clearKey(auctionId: number): Promise<any> {
    await this.redisCacheService.del(
      this.redisClient,
      this.getAuctionCacheKey(auctionId),
    );
    return this.dataLoader.clear(auctionId);
  }

  async getAuctionById(auctionId: number): Promise<any> {
    const cacheKey = this.getAuctionCacheKey(auctionId);
    const getAuctions = () => this.dataLoader.load(auctionId);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.followersttl,
    );
  }

  private getAuctions = async (auctionsIds: number[]) => {
    const cacheKeys = this.getAuctionsCacheKey(auctionsIds);
    let [keys, values] = [[], []];
    const getAuctionsFromCache = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getAuctionsFromCache.includes(null)) {
      const auctions = await getRepository(AuctionEntity)
        .createQueryBuilder('auctions')
        .where('id IN(:...auctionsIds)', {
          auctionsIds: auctionsIds,
        })
        .getMany();
      const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

      auctions.forEach((auction) => {
        if (!auctionsIdentifiers[auction.id]) {
          auctionsIdentifiers[auction.id] = [auction];
        } else {
          auctionsIdentifiers[auction.id].push(auction);
        }
      });
      keys = auctionsIds?.map((auctionId) =>
        this.getAuctionCacheKey(auctionId),
      );
      values = auctionsIds?.map((auctionId) =>
        auctionsIdentifiers[auctionId] ? auctionsIdentifiers[auctionId] : [],
      );

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return auctionsIds?.map((auctionId) => auctionsIdentifiers[auctionId]);
    }
  };

  private getAuctionsCacheKey(auctionIds: number[]) {
    return auctionIds.map((id) => this.getAuctionCacheKey(id));
  }

  private getAuctionCacheKey(id: number) {
    return generateCacheKeyFromParams('auction', id);
  }
}
