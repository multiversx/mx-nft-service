import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { cacheConfig } from 'src/config';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionsProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.getAuctions(keys),
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  async getAuctionsByIdentifier(identifier: string): Promise<any> {
    return await this.dataLoader.load(identifier);
  }

  private getAuctions = async (identifiers: string[]) => {
    const cacheKey = this.getAuctionsCacheKey(identifiers);
    const getAuctions = () => this.batchAuctions(identifiers);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.auctionsttl,
    );
  };

  private batchAuctions = async (identifiers: string[]) => {
    const auctions = await getRepository(AuctionEntity)
      .createQueryBuilder('auctions')
      .where(
        'identifier IN(:...identifiers) AND Status not in ("Closed", "Ended")',
        {
          identifiers: identifiers,
        },
      )
      .getMany();
    const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

    auctions.forEach((auction) => {
      if (!auctionsIdentifiers[auction.identifier]) {
        auctionsIdentifiers[auction.identifier] = [auction];
      } else {
        auctionsIdentifiers[auction.identifier].push(auction);
      }
    });

    return identifiers?.map((identifier) => auctionsIdentifiers[identifier]);
  };
  private getAuctionsCacheKey(identifiers: string[]) {
    return generateCacheKeyFromParams('auctions', identifiers.toString());
  }
}
