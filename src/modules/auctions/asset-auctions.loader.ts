import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { BaseProvider } from '../common/base.loader';
import { getAuctionsForAsset } from 'src/db/auctions/sql.queries';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsForAssetRedisHandler } from './asset-auctions.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsForAssetProvider extends BaseProvider<string> {
  constructor(auctionsForAssetRedisHandler: AuctionsForAssetRedisHandler) {
    super(
      auctionsForAssetRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getAuctionsForAsset(
        identifiers.map((value) => value.split('_')[0]),
        parseInt(identifiers[0].split('_')[1]),
        parseInt(identifiers[0].split('_')[2]),
      ),
    );
    return auctions?.groupBy((auction) => auction.batchKey);
  }
}
