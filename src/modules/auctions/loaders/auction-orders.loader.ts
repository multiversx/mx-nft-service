import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsOrdersRedisHandler } from './auction-orders.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsOrdersProvider extends BaseProvider<string> {
  constructor(auctionsOrdersRedisHandler: AuctionsOrdersRedisHandler, private persistenceService: PersistenceService) {
    super(auctionsOrdersRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(auctionIds: string[]) {
    const orders = await this.persistenceService.getOrdersByComposedKeys(auctionIds);
    return orders?.groupBy((orders) => orders.batchKey);
  }
}
