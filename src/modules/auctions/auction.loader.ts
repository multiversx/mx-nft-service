import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { BaseProvider } from '../common/base.loader';
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
