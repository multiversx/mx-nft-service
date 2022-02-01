import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { BaseProvider } from 'src/modules/assets/base.loader';
import { OrderEntity } from 'src/db/orders';
import { getOrdersForAuctions } from 'src/db/auctions/sql.queries';
import { Injectable, Scope } from '@nestjs/common';
import { AuctionsOrdersRedisHandler } from './auction-orders.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuctionsOrdersProvider extends BaseProvider<string> {
  constructor(auctionsOrdersRedisHandler: AuctionsOrdersRedisHandler) {
    super(
      auctionsOrdersRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getData(auctionIds: string[]) {
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
