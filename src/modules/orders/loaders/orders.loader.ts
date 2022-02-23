import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrdersRedisHandler } from './orders.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { OrderEntity } from 'src/db/orders';

@Injectable({
  scope: Scope.REQUEST,
})
export class OrdersProvider extends BaseProvider<number> {
  constructor(ordersRedisHandler: OrdersRedisHandler) {
    super(
      ordersRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getData(auctionIds: number[]) {
    const orders = await getRepository(OrderEntity)
      .createQueryBuilder('orders')
      .orderBy('priceAmount', 'DESC')
      .where(`auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();

    return orders?.groupBy((auction) => auction.auctionId);
  }
}
