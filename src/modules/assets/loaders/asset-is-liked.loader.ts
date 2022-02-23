import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AssetLikeEntity } from 'src/db/assets';
import { BaseProvider } from '../base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { IsAssetLikedRedisHandler } from './asset-is-liked.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class IsAssetLikedProvider extends BaseProvider<string> {
  constructor(isAssetLikedRedisHandler: IsAssetLikedRedisHandler) {
    super(
      isAssetLikedRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
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
