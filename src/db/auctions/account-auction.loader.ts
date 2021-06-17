import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from './auction.entity';

const batchAuctions = async (owners: string[]) => {
  const auctions = await getRepository(AuctionEntity)
    .createQueryBuilder('auctions')
    .where(
      'ownerAddress IN(:...owners) AND Status not in ("Closed", "Ended")',
      {
        owners: owners,
      },
    )
    .getMany();
  const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

  auctions.forEach((auction) => {
    if (!auctionsIdentifiers[auction.ownerAddress]) {
      auctionsIdentifiers[auction.ownerAddress] = [auction];
    } else {
      auctionsIdentifiers[auction.ownerAddress].push(auction);
    }
  });

  let resp = owners.map((identifier) => auctionsIdentifiers[identifier]);
  return resp;
};
const acountAuctionLoader = () => new DataLoader(batchAuctions);

export { acountAuctionLoader as acountAuctionLoader };
