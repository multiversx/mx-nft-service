import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { AssetAuctionsCountRedisHandler } from './asset-auctions-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetAuctionsCountProvider extends BaseProvider<string> {
  constructor(
    assetAuctionsCountRedisHandler: AssetAuctionsCountRedisHandler,
    private auctionsServiceDb: AuctionsServiceDb,
  ) {
    super(
      assetAuctionsCountRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await this.auctionsServiceDb.getAuctionCountForIdentifiers(
      identifiers,
    );

    return auctions?.groupBy((asset) => asset.identifier);
  }
}
