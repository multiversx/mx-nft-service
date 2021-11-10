import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { getRepository } from 'typeorm';
import { AuctionEntity } from '../../db/auctions/auction.entity';
import * as Redis from 'ioredis';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { getDefaultAuctionsQueryForIdentifiers } from 'src/db/auctions/sql.queries';
import { DateUtils } from 'src/utils/date-utils';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionsForAssetProvider {
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

    try {
      await this.dataLoader.load(identifier);
    } catch (error) {
      console.log('getAuctionsByIdentifier ', error.toString());
    }

    const getAuctions = () => this.dataLoader.load(identifier);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getAuctions,
      30,
    );
  }

  private getAuctions = async (identifiers: string[]) => {
    const cacheKeys = this.getAuctionsCacheKey(identifiers);
    let [keys, values] = [[], []];
    const getAuctionsFromCache = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );

    const endDate = DateUtils.getCurrentTimestampPlus(12);
    if (getAuctionsFromCache.includes(null)) {
      const auctions = await getRepository(AuctionEntity).query(
        getDefaultAuctionsQueryForIdentifiers(endDate, identifiers),
      );
      const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

      auctions.forEach((auction) => {
        if (!auctionsIdentifiers[auction.identifier]) {
          auctionsIdentifiers[auction.identifier] = [auction];
        } else {
          auctionsIdentifiers[auction.identifier].push(auction);
        }
      });
      keys = identifiers?.map((identifier) =>
        this.getAuctionCacheKey(identifier),
      );
      values = identifiers?.map((identifier) =>
        auctionsIdentifiers[identifier] ? auctionsIdentifiers[identifier] : [],
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        30,
      );
      return identifiers?.map((identifier) => auctionsIdentifiers[identifier]);
    }
  };

  private getAuctionsCacheKey(identifiers: string[]) {
    return identifiers.map((id) => this.getAuctionCacheKey(id));
  }

  private getAuctionCacheKey(identifier: string) {
    return generateCacheKeyFromParams('default_auctions', identifier);
  }
}
