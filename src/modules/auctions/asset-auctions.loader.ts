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
    { cache: false },
  );
  private redisClient: Redis.Redis;

  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async clearKey(identifier: string): Promise<any> {
    await this.redisCacheService.del(
      this.redisClient,
      this.getAuctionCacheKey(identifier),
    );
    return this.dataLoader.clear(identifier);
  }

  async getAuctionsByIdentifier(identifier: string): Promise<any> {
    const cacheKey = this.getAuctionCacheKey(identifier);
    const getAuctions = () => this.dataLoader.load(identifier);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      cacheConfig.followersttl,
    );
  }

  private getAuctions = async (identifiers: string[]) => {
    const cacheKeys = this.getAuctionsCacheKey(identifiers);
    let [keys, values] = [[], []];
    const getAuctionsFromCache = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getAuctionsFromCache.includes(null)) {
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
        keys = [...keys, this.getAuctionCacheKey(auction.identifier)];
        values = [...values, auction];
      });
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return identifiers?.map((identifier) => auctionsIdentifiers[identifier]);
    }
  };

  private getAuctionsCacheKey(identifiers: string[]) {
    return identifiers.map((id) => this.getAuctionCacheKey(id));
  }

  private getAuctionCacheKey(identifier: string) {
    return generateCacheKeyFromParams('auctions', identifier);
  }
}
