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
export class IsAssetLikedProvider extends BaseProvider<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(
      'isAssetLiked',
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
              liked: 0,
            },
          ],
    );
  }

  async getDataFromDb(identifiers: string[]) {
    const assetsLike = await getRepository(AssetLikeEntity)
      .createQueryBuilder('al')
      .select('CONCAT(al.identifier,"_",al.address) as identifier')
      .addSelect('true as liked')
      .where(
        `al.identifier IN(${identifiers.map(
          (value) => `'${value.split('_')[0]}'`,
        )})`,
        {
          identifiers: identifiers,
        },
      )
      .andWhere(`al.address = '${identifiers[0].split('_')[1]}'`)
      .groupBy('al.identifier, al.address')
      .execute();
    return assetsLike?.groupBy((asset) => asset.identifier);
  }
}
