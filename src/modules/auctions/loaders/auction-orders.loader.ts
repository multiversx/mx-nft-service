import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { OrdersServiceDb } from 'src/db/orders';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsOrdersRedisHandler } from './auction-orders.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsOrdersProvider extends BaseProvider<string> {
  constructor(
    auctionsOrdersRedisHandler: AuctionsOrdersRedisHandler,
    private ordersServiceDb: OrdersServiceDb,
  ) {
    super(
      auctionsOrdersRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionIds: string[]) {
    const orders = await this.ordersServiceDb.getOrdersByComposedKeys(
      auctionIds,
    );
    return orders?.groupBy((orders) => orders.batchKey);
  }
}
