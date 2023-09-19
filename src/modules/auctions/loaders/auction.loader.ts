import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { BaseProvider } from 'src/modules/common/base.loader';
import { AuctionsRedisHandler } from './auctions.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionProvider extends BaseProvider<number> {
  constructor(auctionsRedisHandler: AuctionsRedisHandler, private persistenceService: PersistenceService) {
    super(auctionsRedisHandler, new DataLoader(async (keys: number[]) => await this.batchLoad(keys)));
  }

  async getData(auctionsIds: number[]) {
    const auctions = await this.persistenceService.getBulkAuctions(auctionsIds);
    return auctions?.groupBy((auction) => auction.id);
  }
}
