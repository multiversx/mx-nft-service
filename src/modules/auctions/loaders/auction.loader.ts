import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { BaseProvider } from 'src/modules/common/base.loader';
import { getRepository } from 'typeorm';
import { AuctionsRedisHandler } from './auctions.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionProvider extends BaseProvider<number> {
  constructor(auctionsRedisHandler: AuctionsRedisHandler) {
    super(
      auctionsRedisHandler,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionsIds: number[]) {
    const auctions = await getRepository(AuctionEntity)
      .createQueryBuilder('auctions')
      .where('id IN(:...auctionsIds)', {
        auctionsIds: auctionsIds,
      })
      .getMany();
    return auctions?.groupBy((auction) => auction.id);
  }
}
