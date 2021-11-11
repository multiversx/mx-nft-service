import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { getAvailableTokensbyAuctionIds } from '../auctions/sql.queries';
import { AuctionEntity } from '../auctions';
import { BaseProvider } from 'src/modules/assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AvailableTokensForAuctionProvider extends BaseProvider<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction_available_tokens',
      redisCacheService,
      new DataLoader(
        async (keys: number[]) => await this.batchGetAvailableTokens(keys),
        {
          cache: false,
        },
      ),
    );
  }

  private batchGetAvailableTokens = async (auctionIds: number[]) => {
    const cacheKeys = this.getCacheKeys(auctionIds);
    let [keys, values] = [cacheKeys, []];
    const getAvailableTokensFromCache =
      await this.redisCacheService.batchGetCache(this.redisClient, cacheKeys);
    if (getAvailableTokensFromCache.includes(null)) {
      const results = await this.getAvailableTokensForAuctionIds(auctionIds);
      const auctionsIds: { [key: string]: any[] } = {};
      results.forEach(
        (result: { auctionId: number; availableTokens: number }) => {
          if (!auctionsIds[result.auctionId]) {
            auctionsIds[result.auctionId] = [
              {
                auctionId: result.auctionId,
                availableTokens: result.availableTokens,
              },
            ];
          } else {
            auctionsIds[result.auctionId].push(result);
          }
        },
      );
      values = auctionIds?.map((auctionId) =>
        auctionsIds[auctionId]
          ? auctionsIds[auctionId]
          : [
              {
                auctionId: auctionId,
                availableTokens: 0,
              },
            ],
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return auctionIds.map((auctionId) => auctionsIds[auctionId]);
    }
    return getAvailableTokensFromCache;
  };

  private async getAvailableTokensForAuctionIds(auctionIds: number[]) {
    return await await getRepository(AuctionEntity).query(
      getAvailableTokensbyAuctionIds(auctionIds),
    );
  }
}
