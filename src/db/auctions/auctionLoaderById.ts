import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from './auction.entity';

const batchAuctions = async (auctionsIds: number[]) => {
  const auctions = await getRepository(AuctionEntity)
    .createQueryBuilder('auctions')
    .where('id IN(:...auctionsIds) AND Status not in ("Closed", "Ended")', {
      auctionsIds: auctionsIds,
    })
    .getMany();
  const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

  auctions.forEach((auction) => {
    if (!auctionsIdentifiers[auction.id]) {
      auctionsIdentifiers[auction.id] = [auction];
    } else {
      auctionsIdentifiers[auction.id].push(auction);
    }
  });

  let resp = auctionsIds.map((id) => auctionsIdentifiers[id]);
  return resp;
};
const auctionLoaderById = () => new DataLoader(batchAuctions);

export { auctionLoaderById as auctionLoaderById };
