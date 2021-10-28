import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { Number } from 'aws-sdk/clients/iot';
import { getAvailableTokensbyAuctionIds } from '../auctions/sql.queries';
import { AuctionEntity } from '../auctions';

@Injectable({
  scope: Scope.Operation,
})
export class AvailableTokensForAuctionProvider {
  private dataLoader = new DataLoader(
    async (keys: number[]) => await this.batchGetAvailableTokens(keys),
    { cache: false },
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getAvailableTokensForAuctionId(auctionId: number): Promise<any> {
    const cacheKey = this.getAvailableTokensForAuctionCacheKey(auctionId);
    const getAuctions = () => this.dataLoader.load(auctionId);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.followersttl,
    );
  }

  private batchGetAvailableTokens = async (auctionIds: number[]) => {
    const cacheKeys = this.getOrdersForAuctionCacheKeys(auctionIds);
    let [keys, values] = [[], []];
    const getAvailableTokensFromCache =
      await this.redisCacheService.batchGetCache(this.redisClient, cacheKeys);
    if (getAvailableTokensFromCache.includes(null)) {
      const results = await this.getAvailableTokensForAuctionIds(auctionIds);
      const auctionsIds: { [key: string]: any[] } = {};
      console.log(results);
      results.forEach(
        (result: { auctionId: number; availableTokens: number }) => {
          if (!auctionsIds[result.auctionId]) {
            auctionsIds[result.auctionId] = [
              {
                auctionId: result.auctionId,
                availableTokens: result.availableTokens,
              },
            ];
          } else {
            auctionsIds[result.auctionId].push(result);
          }
        },
      );
      keys = auctionIds?.map((auctionId) =>
        this.getAvailableTokensForAuctionCacheKey(auctionId),
      );
      values = auctionIds?.map((auctionId) =>
        auctionsIds[auctionId]
          ? auctionsIds[auctionId]
          : {
              auctionId: auctionId,
              availableTokens: 0,
            },
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return auctionIds.map((auctionId) => auctionsIds[auctionId]);
    }
  };

  async clearKey(auctionId: Number): Promise<any> {
    this.dataLoader.clearAll();
    await this.redisCacheService.del(
      this.redisClient,
      this.getAvailableTokensForAuctionCacheKey(auctionId),
    );
    return this.dataLoader.clear(auctionId);
  }

  private async getAvailableTokensForAuctionIds(auctionIds: number[]) {
    return await await getRepository(AuctionEntity).query(
      getAvailableTokensbyAuctionIds(auctionIds),
    );
  }

  private getOrdersForAuctionCacheKeys(auctionId: number[]) {
    return auctionId.map((id) => this.getAvailableTokensForAuctionCacheKey(id));
  }

  private getAvailableTokensForAuctionCacheKey(auctionId: number) {
    return generateCacheKeyFromParams('auction_available_tokens', auctionId);
  }
}
