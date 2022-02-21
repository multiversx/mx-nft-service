import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondApiService, RedisCacheService } from 'src/common';
import { BaseProvider } from './base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AssetsSupplyLoader extends BaseProvider<string> {
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: ElrondApiService,
  ) {
    super(
      'asset_supply',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
      5,
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      '&withSupply=true&source=elastic&fields=identifier,supply',
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  mapValuesForRedis(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) =>
      assetsIdentifiers && assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier]
        : null,
    );
  }

  public batchSupplyInfo = async (identifiers: string[], data: any) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getDataFromRedis.includes(null)) {
      values = identifiers.map((identifier) =>
        data && data[identifier] ? data[identifier] : null,
      );

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        5,
      );
      return values;
    }
    return getDataFromRedis;
  };
}
