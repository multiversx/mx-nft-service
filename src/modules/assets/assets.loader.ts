import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import * as Redis from 'ioredis';
import { ElrondApiService, Nft, RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { BaseProvider } from './base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AssetsProvider extends BaseProvider<string> {
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: ElrondApiService,
  ) {
    super(
      'assets',
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
      '&withOwner=true',
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  mapValuesForRedis(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) => {
      return assetsIdentifiers[identifier];
    });
  }
}
