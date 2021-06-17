import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AuctionEntity } from './auction.entity';

const batchAuctions = async (identifiers: string[]) => {
  const auctions = await getRepository(AuctionEntity)
    .createQueryBuilder('auctions')
    .where('identifier IN(:...identifiers)', {
      identifiers: identifiers,
    })
    .getMany();
  const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

  auctions.forEach((auction) => {
    if (!auctionsIdentifiers[auction.identifier]) {
      console.log(auction as any);
      auctionsIdentifiers[auction.identifier] = [auction];
    } else {
      auctionsIdentifiers[auction.identifier].push(auction);
    }
  });

  let resp = identifiers.map((identifier) => auctionsIdentifiers[identifier]);
  return resp;
};
const auctionsByIdentifierLoader = () => new DataLoader(batchAuctions);

export { auctionsByIdentifierLoader as auctionsByIdentifierLoader };
