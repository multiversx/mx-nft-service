import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../../db/auctions/auction.entity';
import { BaseProvider } from '../../common/base.loader';
import { getActiveAuctionsCountForCollection } from 'src/db/auctions/sql.queries';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsForCollectionRedisHandler } from './collection-auctions.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsForCollectionProvider extends BaseProvider<string> {
  constructor(auctionsForAssetRedisHandler: AuctionsForCollectionRedisHandler) {
    super(
      auctionsForAssetRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getActiveAuctionsCountForCollection(identifiers),
    );
    return auctions?.groupBy((auction) => auction.collection);
  }
}
