import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { OrdersRedisHandler } from './orders.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { OrdersServiceDb } from 'src/db/orders';

@Injectable({
  scope: Scope.REQUEST,
})
export class OrdersProvider extends BaseProvider<number> {
  constructor(
    ordersRedisHandler: OrdersRedisHandler,
    private ordersServiceDb: OrdersServiceDb,
  ) {
    super(
      ordersRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getData(auctionIds: number[]) {
    const orders = await this.ordersServiceDb.getOrdersByAuctionIdsOrderByPrice(
      auctionIds,
    );

    return orders?.groupBy((auction) => auction.auctionId);
  }
}
