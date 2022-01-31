import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { RedisCacheService } from 'src/common';
import { BaseProvider } from 'src/modules/assets/base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class LastOrderProvider extends BaseProvider<number> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'auction_active_orders',
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
    return auctionIds?.map((auctionId) =>
      ordersAuctionsIds[auctionId] ? ordersAuctionsIds[auctionId] : [],
    );
  }

  async getDataFromDb(auctionIds: number[]) {
    const orders = await getRepository(OrderEntity)
      .createQueryBuilder('orders')
      .orderBy('priceAmount', 'DESC')
      .where(
        `auctionId IN(:...auctionIds) and status in ('active', 'bought')`,
        {
          auctionIds: auctionIds,
        },
      )
      .getMany();

    return orders?.groupBy((asset) => asset.auctionId);
  }
}
