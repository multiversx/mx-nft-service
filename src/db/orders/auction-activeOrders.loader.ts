import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { OrderEntity } from './order.entity';

const batchActiveOrders = async (auctionIds: number[]) => {
  const activeOrders = await getRepository(OrderEntity)
    .createQueryBuilder('orders')
    .orderBy('priceAmount', 'DESC')
    .where(`auctionId IN(:...auctionIds) and status='active'`, {
      auctionIds: auctionIds,
    })
    .getMany();
  const auctionsIdentifiers: { [key: string]: OrderEntity[] } = {};

  activeOrders.forEach((auction) => {
    if (!auctionsIdentifiers[auction.auctionId]) {
      auctionsIdentifiers[auction.auctionId] = [auction];
    } else {
      auctionsIdentifiers[auction.auctionId].push(auction);
    }
  });

  return auctionIds.map((auctionId) => auctionsIdentifiers[auctionId]);
};
const auctionActiveOrdersLoader = () => new DataLoader(batchActiveOrders);

export { auctionActiveOrdersLoader as auctionActiveOrdersLoader };
