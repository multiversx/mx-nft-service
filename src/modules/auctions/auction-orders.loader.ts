import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
import { BaseProvider } from 'src/modules/assets/base.loader';
import { OrderEntity } from 'src/db/orders';
import { getOrdersForAuctions } from 'src/db/auctions/sql.queries';

@Injectable({
  scope: Scope.Operation,
})
export class AuctionsOrdersProvider extends BaseProvider<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction_orders',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  mapValuesForRedis(
    auctionIds: string[],
    ordersAuctionsIds: { [key: string]: OrderEntity[] },
  ) {
    return auctionIds?.map((id) =>
      ordersAuctionsIds[id] ? ordersAuctionsIds[id] : [],
    );
  }

  async getDataFromDb(auctionIds: string[]) {
    const orders = await getRepository(OrderEntity).query(
      getOrdersForAuctions(
        auctionIds.map((value) => value.split('_')[0]),
        parseInt(auctionIds[0].split('_')[1]),
        parseInt(auctionIds[0].split('_')[2]),
      ),
    );
    return orders?.groupBy((auction) => auction.batchKey);
  }
}
