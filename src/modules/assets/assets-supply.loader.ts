import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondApiService, Nft } from 'src/common';

@Injectable({
  scope: Scope.Operation,
})
export class AssetsSupplyLoader {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.batchAssetsSupply(keys),
    { cache: false },
  );

  constructor(private apiService: ElrondApiService) {}

  batchAssetsSupply = async (keys: string[]) => {
    const uniqueKeys = [...new Set(keys)];
    const nfts = await this.apiService.getNftsByIdentifiers(
      uniqueKeys,
      0,
      '&withSupply=true&fields=identifier,supply',
    );
    const assetsIdentifiers: { [key: string]: Nft[] } = {};

    nfts.forEach((nft) => {
      if (!assetsIdentifiers[nft.identifier]) {
        assetsIdentifiers[nft.identifier] = [nft];
      } else {
        assetsIdentifiers[nft.identifier].push(nft);
      }
    });
    let resp = keys.map((identifier) => assetsIdentifiers[identifier]);
    return resp;
  };

  async getSupply(identifier: string): Promise<Nft> {
    const nft = await this.dataLoader.load(identifier);
    return nft && nft.length > 0 ? nft[0] : null;
  }
}
