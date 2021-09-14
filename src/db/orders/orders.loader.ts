import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import * as Redis from 'ioredis';
import { OrderEntity } from './order.entity';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { Number } from 'aws-sdk/clients/iot';

@Injectable({
  scope: Scope.Operation,
})
export class OrdersProvider {
  private dataLoader = new DataLoader(
    async (keys: number[]) => await this.batchOrders(keys),
    { cache: false },
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getOrderByAuctionId(auctionId: number): Promise<any> {
    const cacheKey = this.getOrdersForAuctionCacheKey(auctionId);
    const getAuctions = () => this.dataLoader.load(auctionId);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.followersttl,
    );
  }

  private batchOrders = async (auctionIds: number[]) => {
    const cacheKeys = this.getOrdersForAuctionCacheKeys(auctionIds);
    let [keys, values] = [[], []];
    const getOrdersFromCache = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getOrdersFromCache.includes(null)) {
      const orders = await getRepository(OrderEntity)
        .createQueryBuilder('orders')
        .orderBy('priceAmount', 'DESC')
        .where(`auctionId IN(:...auctionIds) and status='active'`, {
          auctionIds: auctionIds,
        })
        .getMany();
      const auctionsIdentifiers: { [key: string]: OrderEntity[] } = {};

      orders.forEach((order) => {
        if (!auctionsIdentifiers[order.auctionId]) {
          auctionsIdentifiers[order.auctionId] = [order];
        } else {
          auctionsIdentifiers[order.auctionId].push(order);
        }
        keys = [...keys, this.getOrdersForAuctionCacheKey(order.auctionId)];
        values = [...values, order];
      });
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return auctionIds.map((auctionId) => auctionsIdentifiers[auctionId]);
    }
  };

  async clearKey(auctionId: Number): Promise<any> {
    this.dataLoader.clearAll();
    await this.redisCacheService.del(
      this.redisClient,
      this.getOrdersForAuctionCacheKey(auctionId),
    );
    return this.dataLoader.clear(auctionId);
  }

  private getOrdersForAuctionCacheKeys(auctionId: number[]) {
    return auctionId.map((id) => this.getOrdersForAuctionCacheKey(id));
  }

  private getOrdersForAuctionCacheKey(auctionId: number) {
    return generateCacheKeyFromParams('auction_orders', auctionId);
  }
}
