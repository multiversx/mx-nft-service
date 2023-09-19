import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { OnSaleAssetsCountForCollectionRedisHandler } from './onsale-assets-count.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class OnSaleAssetsCountForCollectionProvider extends BaseProvider<string> {
  constructor(auctionsForAssetRedisHandler: OnSaleAssetsCountForCollectionRedisHandler, private persistenceService: PersistenceService) {
    super(auctionsForAssetRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const auctions = await this.persistenceService.getOnSaleAssetCountForCollections(identifiers);
    return auctions?.groupBy((auction) => auction.collection);
  }
}
