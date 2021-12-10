import { Injectable, Scope } from 'graphql-modules';
import DataLoader = require('dataloader');
import { ElrondApiService, RedisCacheService } from 'src/common';
import { BaseProvider } from './base.loader';
import { Asset } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { ScamInfo } from './models/ScamInfo.dto';

@Injectable({
  scope: Scope.Operation,
})
export class AssetsProvider extends BaseProvider<string> {
  constructor(
    redisCacheService: RedisCacheService,
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
    this.batchScamInfo(identifiers, nftsGrouped);

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

  batchScamInfo = async (identifiers: string[], data) => {
    const cacheKeys = this.getCacheKeysForScam(identifiers);
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

  getCacheKeysForScam(key: string[]) {
    return key.map((id) => this.getCacheKeyForScam(id));
  }

  getCacheKeyForScam(key: string) {
    return generateCacheKeyFromParams('asset_scam_info', key);
  }
}
