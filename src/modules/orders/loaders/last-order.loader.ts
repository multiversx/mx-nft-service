import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { LastOrderRedisHandler } from './last-order.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class LastOrdersProvider extends BaseProvider<number> {
  constructor(lastOrder: LastOrderRedisHandler, private persistenceService: PersistenceService) {
    super(lastOrder, new DataLoader(async (keys: number[]) => await this.batchLoad(keys)));
  }

  async getData(auctionIds: number[]) {
    const orders = await this.persistenceService.getLastOrdersByAuctionIds(auctionIds);

    return orders?.groupBy((asset) => asset.auctionId);
  }
}
