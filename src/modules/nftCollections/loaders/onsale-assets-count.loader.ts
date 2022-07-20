import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../../db/auctions/auction.entity';
import { BaseProvider } from '../../common/base.loader';
import { getOnSaleAssetsCountForCollection } from 'src/db/auctions/sql.queries';
import { Injectable, Scope } from '@nestjs/common';
import { OnSaleAssetsCountForCollectionRedisHandler } from './onsale-assets-count.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class OnSaleAssetsCountForCollectionProvider extends BaseProvider<string> {
  constructor(
    auctionsForAssetRedisHandler: OnSaleAssetsCountForCollectionRedisHandler,
  ) {
    super(
      auctionsForAssetRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getOnSaleAssetsCountForCollection(identifiers),
    );
    return auctions?.groupBy((auction) => auction.collection);
  }
}
