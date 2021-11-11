import DataLoader = require('dataloader');
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { AssetLikeEntity } from 'src/db/assets';
import { BaseProvider } from './base.loader';

@Injectable({
  scope: Scope.Operation,
})
export class AssetLikesProvider extends BaseProvider<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'assetLikesCount',
      redisCacheService,
      new DataLoader(
        async (keys: string[]) => await this.batchAssetLikesCount(keys),
        { cache: false },
      ),
    );
  }

  private batchAssetLikesCount = async (identifiers: string[]) => {
    const cacheKeys = this.getCacheKeys(identifiers);
    let [keys, values] = [cacheKeys, []];
    const getLikesCount = await this.redisCacheService.batchGetCache(
      this.redisClient,
      cacheKeys,
    );
    if (getLikesCount.includes(null)) {
      const assetLikes = await getRepository(AssetLikeEntity)
        .createQueryBuilder('al')
        .select('al.identifier as identifier')
        .addSelect('COUNT(al.identifier) as likesCount')
        .where(
          `al.identifier IN(${identifiers.map((value) => `'${value}'`)})`,
          {
            identifiers: identifiers,
          },
        )
        .groupBy('al.identifier')
        .execute();
      const assetsIdentifiers: { [key: string]: any[] } = {};
      assetLikes?.forEach(
        (asset: { identifier: string; likesCount: string }) => {
          if (!assetsIdentifiers[asset.identifier]) {
            assetsIdentifiers[asset.identifier] = [
              {
                identifier: asset.identifier,
                likesCount: parseInt(asset.likesCount),
              },
            ];
          } else {
            assetsIdentifiers[asset.identifier].push(asset);
          }
        },
      );
      values = identifiers?.map((identifier) =>
        assetsIdentifiers[identifier]
          ? assetsIdentifiers[identifier]
          : [
              {
                identifier: identifier,
                likesCount: 0,
              },
            ],
      );
      await this.redisCacheService.batchSetCache(
        this.redisClient,
        keys,
        values,
        cacheConfig.followersttl,
      );
      return identifiers?.map((identifier) => assetsIdentifiers[identifier]);
    }
    return getLikesCount;
  };
}
