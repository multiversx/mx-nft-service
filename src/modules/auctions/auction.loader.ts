import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { RedisCacheService } from 'src/common';
import { BaseProvider } from '../assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionProvider extends BaseProvider<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction',
      redisCacheService,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  mapValuesForRedis(
    auctionsIds: number[],
    auctionsIdentifiers: { [key: string]: AuctionEntity[] },
  ) {
    return auctionsIds?.map((auctionId) =>
      auctionsIdentifiers[auctionId] ? auctionsIdentifiers[auctionId] : [],
    );
  }

  async getDataFromDb(auctionsIds: number[]) {
    const auctions = await getRepository(AuctionEntity)
      .createQueryBuilder('auctions')
      .where('id IN(:...auctionsIds)', {
        auctionsIds: auctionsIds,
      })
      .getMany();
    return auctions?.groupBy((auction) => auction.id);
  }
}
