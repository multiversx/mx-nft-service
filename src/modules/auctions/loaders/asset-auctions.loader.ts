import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsForAssetRedisHandler } from './asset-auctions.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsForAssetProvider extends BaseProvider<string> {
  constructor(auctionsForAssetRedisHandler: AuctionsForAssetRedisHandler, private persistenceService: PersistenceService) {
    super(auctionsForAssetRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const auctions = await this.persistenceService.getAuctionsForIdentifiers(identifiers);
    return auctions?.groupBy((auction) => auction.batchKey);
  }
}
