import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { RedisCacheService } from 'src/common';
import { BaseProvider } from 'src/modules/assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class OrdersProvider extends BaseProvider<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction_orders',
      redisCacheService,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  mapValuesForRedis(
    auctionIds: number[],
    ordersAuctionsIds: { [key: string]: OrderEntity[] },
  ) {
    return auctionIds?.map((id) =>
      ordersAuctionsIds[id] ? ordersAuctionsIds[id] : [],
    );
  }

  async getDataFromDb(auctionIds: number[]) {
    const orders = await getRepository(OrderEntity)
      .createQueryBuilder('orders')
      .orderBy('priceAmount', 'DESC')
      .where(`auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();

    return orders?.groupBy((auction) => auction.auctionId);
  }
}
