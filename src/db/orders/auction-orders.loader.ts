import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from './order.entity';

const batchOrders = async (auctionIds: number[]) => {
  const orders = await getRepository(OrderEntity)
    .createQueryBuilder('orders')
    .orderBy('priceAmount', 'DESC')
    .where('auctionId IN(:...auctionIds)', {
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
const auctionOrdersLoader = () => new DataLoader(batchOrders);

export { auctionOrdersLoader as auctionOrdersLoader };
