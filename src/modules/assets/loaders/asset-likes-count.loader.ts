import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AssetLikeEntity } from 'src/db/assets';
import { BaseProvider } from '../base.loader';
import { AssetLikesProviderRedisHandler } from './asset-likes-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetLikesProvider extends BaseProvider<string> {
  constructor(assetLikesProviderRedisHandler: AssetLikesProviderRedisHandler) {
    super(
      assetLikesProviderRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
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
