import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { OnSaleAssetsCountForCollectionRedisHandler } from './onsale-assets-count.redis-handler';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class OnSaleAssetsCountForCollectionProvider extends BaseProvider<string> {
  constructor(
    auctionsForAssetRedisHandler: OnSaleAssetsCountForCollectionRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      auctionsForAssetRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions =
      await this.auctionsServiceDb.getOnSaleAssetCountForCollections(
        identifiers,
      );
    return auctions?.groupBy((auction) => auction.collection);
  }
}
