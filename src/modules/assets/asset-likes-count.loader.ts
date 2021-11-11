import DataLoader = require('dataloader');
import '../../utils/extentions';
import { Injectable, Scope } from 'graphql-modules';
import { getRepository } from 'typeorm';
import { RedisCacheService } from 'src/common';
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
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys), {
        cache: false,
      }),
    );
  }

  mapValuesForRedis(
    identifiers: string[],
    assetsIdentifiers: { [key: string]: any[] },
  ) {
    return identifiers?.map((identifier) =>
      assetsIdentifiers[identifier]
        ? assetsIdentifiers[identifier]
        : [
            {
              identifier: identifier,
              likesCount: 0,
            },
          ],
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const assetsLike = await getRepository(AssetLikeEntity)
      .createQueryBuilder('al')
      .select('al.identifier as identifier')
      .addSelect('COUNT(al.identifier) as likesCount')
      .where(`al.identifier IN(${identifiers.map((value) => `'${value}'`)})`, {
        identifiers: identifiers,
      })
      .groupBy('al.identifier')
      .execute();
    return assetsLike?.groupBy((asset) => asset.identifier);
  }
}
