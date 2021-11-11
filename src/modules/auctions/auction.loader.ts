import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { BaseProvider } from '../assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionProvider extends BaseProvider<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction',
      redisCacheService,
      new DataLoader(async (keys: number[]) => await this.getAuctions(keys), {
        cache: false,
      }),
    );
  }

  private getAuctions = async (auctionsIds: number[]) => {
    const cacheKeys = this.getCacheKeys(auctionsIds);
    let [keys, values] = [cacheKeys, []];
    const getAuctionsFromCache = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getAuctionsFromCache.includes(null)) {
      const auctions = await getRepository(AuctionEntity)
        .createQueryBuilder('auctions')
        .where('id IN(:...auctionsIds)', {
          auctionsIds: auctionsIds,
        })
        .getMany();
      const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

      auctions.forEach((auction) => {
        if (!auctionsIdentifiers[auction.id]) {
          auctionsIdentifiers[auction.id] = [auction];
        } else {
          auctionsIdentifiers[auction.id].push(auction);
        }
      });
      values = auctionsIds?.map((auctionId) =>
        auctionsIdentifiers[auctionId] ? auctionsIdentifiers[auctionId] : [],
      );

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return auctionsIds?.map((auctionId) => auctionsIdentifiers[auctionId]);
    }
    return getAuctionsFromCache;
  };
}
