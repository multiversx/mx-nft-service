import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { LastOrderRedisHandler } from './last-order.redis-handler';
import { OrdersServiceDb } from 'src/db/orders';

@Injectable({
  scope: Scope.REQUEST,
})
export class LastOrdersProvider extends BaseProvider<number> {
  constructor(
    lastOrder: LastOrderRedisHandler,
    private ordersServiceDb: OrdersServiceDb,
  ) {
    super(
      lastOrder,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionIds: number[]) {
    const orders = await this.ordersServiceDb.getLastOrdersByAuctionIds(
      auctionIds,
    );

    return orders?.groupBy((asset) => asset.auctionId);
  }
}
