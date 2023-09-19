import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { AssetAuctionsCountRedisHandler } from './asset-auctions-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetAuctionsCountProvider extends BaseProvider<string> {
  constructor(assetAuctionsCountRedisHandler: AssetAuctionsCountRedisHandler, private persistenceService: PersistenceService) {
    super(assetAuctionsCountRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const auctions = await this.persistenceService.getAuctionCountForIdentifiers(identifiers);

    return auctions?.groupBy((asset) => asset.identifier);
  }
}
