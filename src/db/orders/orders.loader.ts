import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { BaseProvider } from 'src/modules/assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class OrdersProvider extends BaseProvider<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction_orders',
      redisCacheService,
      new DataLoader(async (keys: number[]) => await this.batchOrders(keys), {
        cache: false,
      }),
    );
  }

  private batchOrders = async (auctionIds: number[]) => {
    const cacheKeys = this.getCacheKeys(auctionIds);
    let [keys, values] = [cacheKeys, []];
    const getOrdersFromCache = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getOrdersFromCache.includes(null)) {
      const orders = await this.getOrdersForAuctionIds(auctionIds);
      const ordersAuctionsIds: { [key: string]: OrderEntity[] } = {};

      orders.forEach((order) => {
        if (!ordersAuctionsIds[order.auctionId]) {
          ordersAuctionsIds[order.auctionId] = [order];
        } else {
          ordersAuctionsIds[order.auctionId].push(order);
        }
      });
      values = auctionIds?.map((id) =>
        ordersAuctionsIds[id] ? ordersAuctionsIds[id] : [],
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return auctionIds.map((auctionId) => ordersAuctionsIds[auctionId]);
    }
    return getOrdersFromCache;
  };

  private async getOrdersForAuctionIds(auctionIds: number[]) {
    return await getRepository(OrderEntity)
      .createQueryBuilder('orders')
      .orderBy('priceAmount', 'DESC')
      .where(`auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();
  }
}
