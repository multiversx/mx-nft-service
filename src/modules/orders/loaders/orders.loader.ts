import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { OrdersRedisHandler } from './orders.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class OrdersProvider extends BaseProvider<number> {
  constructor(ordersRedisHandler: OrdersRedisHandler, private persistenceService: PersistenceService) {
    super(
      ordersRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getData(auctionIds: number[]) {
    const orders = await this.persistenceService.getOrdersByAuctionIdsOrderByPrice(auctionIds);

    return orders?.groupBy((auction) => auction.auctionId);
  }
}
