import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondApiService, RedisCacheService } from 'src/common';
import { BaseProvider } from './base.loader';
import { Asset } from './models';
import { AssetScamInfoProvider } from './assets-scam-info.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AssetsProvider extends BaseProvider<string> {
  constructor(
    redisCacheService: RedisCacheService,
    private assetScamLoader: AssetScamInfoProvider,
    private apiService: ElrondApiService,
  ) {
    super(
      'asset',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      '&withOwner=true&withMetadata=true',
    );
    const nftsGrouped = nfts?.groupBy((asset) => asset.identifier);
    this.assetScamLoader.batchScamInfo(identifiers, nftsGrouped);

    return nftsGrouped;
  }

  mapValuesForRedis(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) => {
      return Asset.fromNft(assetsIdentifiers[identifier][0]);
    });
  }
}
