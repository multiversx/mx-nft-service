import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsForAssetRedisHandler } from './asset-auctions.redis-handler';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsForAssetProvider extends BaseProvider<string> {
  constructor(
    auctionsForAssetRedisHandler: AuctionsForAssetRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      auctionsForAssetRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await this.auctionsServiceDb.getAuctionsForIdentifiers(
      identifiers,
    );
    return auctions?.groupBy((auction) => auction.batchKey);
  }
}
