import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { Nft } from 'src/common/services/elrond-communication/models/nft.dto';

@Injectable({
  scope: Scope.Operation,
})
export class AssetsProvider {
  private dataLoader = new DataLoader(
    async (keys: string[]) => await this.batchAssets(keys),
  );

  constructor(private apiService: ElrondApiService) {}

  batchAssets = async (keys: string[]) => {
    const nfts = await this.apiService.getNftsByIdentifier(keys);
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

  async getNftByIdentifier(identifier: string): Promise<Nft> {
    const nft = await this.dataLoader.load(identifier);
    return nft && nft.length > 0 ? nft[0] : null;
  }
}
