import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { AuctionEntity } from './auction.entity';
@Injectable({
  scope: Scope.Operation,
})
export class AuctionsProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.batchAuctions(keys),
  );

  async getAuctionsByIdentifier(identifier: string): Promise<any> {
    return await this.dataLoader.load(identifier);
  }

  private batchAuctions = async (identifiers: string[]) => {
    const auctions = await getRepository(AuctionEntity)
      .createQueryBuilder('auctions')
      .where(
        'identifier IN(:...identifiers) AND Status not in ("Closed", "Ended")',
        {
          identifiers: identifiers,
        },
      )
      .getMany();
    const auctionsIdentifiers: { [key: string]: AuctionEntity[] } = {};

    auctions.forEach((auction) => {
      if (!auctionsIdentifiers[auction.identifier]) {
        auctionsIdentifiers[auction.identifier] = [auction];
      } else {
        auctionsIdentifiers[auction.identifier].push(auction);
      }
    });

    let resp = identifiers.map((identifier) => auctionsIdentifiers[identifier]);
    return resp;
  };
}
