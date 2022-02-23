import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { BaseProvider } from '../base.loader';
import { AssetAuctionsCountRedisHandler } from './asset-auctions-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetAuctionsCountProvider extends BaseProvider<string> {
  constructor(assetAuctionsCountRedisHandler: AssetAuctionsCountRedisHandler) {
    super(
      assetAuctionsCountRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const auctions = await getRepository(AuctionEntity)
      .createQueryBuilder('a')
      .select('a.identifier as identifier')
      .addSelect('COUNT(a.identifier) as auctionsCount')
      .where(
        `a.identifier IN(${identifiers.map(
          (value) => `'${value}'`,
        )}) and a.status='Running'`,
        {
          identifiers: identifiers,
        },
      )
      .groupBy('a.identifier')
      .execute();

    return auctions?.groupBy((asset) => asset.identifier);
  }
}
