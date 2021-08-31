import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from './order.entity';

@Injectable({
  scope: Scope.Operation,
})
export class OrdersProvider {
  private dataLoader = new DataLoader(
    async (keys: number[]) => await this.batchOrders(keys),
  );

  async getOrderByAuctionId(auctionId: number): Promise<any> {
    return await this.dataLoader.load(auctionId);
  }

  private batchOrders = async (auctionIds: number[]) => {
    const orders = await getRepository(OrderEntity)
      .createQueryBuilder('orders')
      .orderBy('priceAmount', 'DESC')
      .where(`auctionId IN(:...auctionIds) and status='active'`, {
        auctionIds: auctionIds,
      })
      .getMany();
    const auctionsIdentifiers: { [key: string]: OrderEntity[] } = {};

    orders.forEach((auction) => {
      if (!auctionsIdentifiers[auction.auctionId]) {
        auctionsIdentifiers[auction.auctionId] = [auction];
      } else {
        auctionsIdentifiers[auction.auctionId].push(auction);
      }
    });

    return auctionIds.map((auctionId) => auctionsIdentifiers[auctionId]);
  };
}
