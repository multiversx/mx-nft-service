import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
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
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  mapValuesForRedis(
    auctionIds: number[],
    auctionsIds: { [key: string]: any[] },
  ) {
    return auctionIds?.map((auctionId) =>
      auctionsIds[auctionId]
        ? auctionsIds[auctionId]
        : [
            {
              auctionId: auctionId,
              availableTokens: 0,
            },
          ],
    );
  }

  async getDataFromDb(auctionIds: number[]) {
    const auctions = await getRepository(AuctionEntity).query(
      getAvailableTokensbyAuctionIds(auctionIds),
    );
    return auctions?.groupBy((auction) => auction.auctionId);
  }
}
