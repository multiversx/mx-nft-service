import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from '../../../db/orders/order.entity';
import { BaseProvider } from 'src/modules/assets/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { LastOrderRedisHandler } from './last-order.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class LastOrdersProvider extends BaseProvider<number> {
  constructor(lastOrder: LastOrderRedisHandler) {
    super(
      lastOrder,
      new DataLoader(async (keys: number[]) => await this.batchLoad(keys)),
    );
  }

  async getData(auctionIds: number[]) {
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
