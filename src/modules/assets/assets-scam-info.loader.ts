import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondApiService, RedisCacheService } from 'src/common';
import { BaseProvider } from './base.loader';
import { ScamInfo } from './models/ScamInfo.dto';

@Injectable({
  scope: Scope.Operation,
})
export class AssetScamInfoProvider extends BaseProvider<string> {
  constructor(
    redisCacheService: RedisCacheService,
    private apiService: ElrondApiService,
  ) {
    super(
      'asset_scam_info',
      redisCacheService,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
      1800,
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      '&withOwner=true&withMetadata=true&fields=identifier,scamInfo',
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  mapValuesForRedis(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers.map((identifier) => {
      return ScamInfo.fromNftScamInfo(
        assetsIdentifiers[identifier][0].scamInfo,
      );
    });
  }

  public batchScamInfo = async (identifiers: string[], data: any) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [redisKeys, values] = [cacheKeys, []];
    const getDataFromRedis = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getDataFromRedis.includes(null)) {
      values = identifiers.map((identifier) => {
        return ScamInfo.fromNftScamInfo(data[identifier][0].scamInfo);
      });

      await this.redisCacheService.batchSetCache(
        this.redisClient,
        redisKeys,
        values,
        1800,
      );
      return values;
    }
    return getDataFromRedis;
  };
}
