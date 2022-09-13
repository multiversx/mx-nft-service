import DataLoader = require('dataloader');
import { AssetsLikesRepository } from 'src/db/assets';
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { IsAssetLikedRedisHandler } from './asset-is-liked.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class IsAssetLikedProvider extends BaseProvider<string> {
  constructor(
    isAssetLikedRedisHandler: IsAssetLikedRedisHandler,
    private assetsLikesRepository: AssetsLikesRepository,
  ) {
    super(
      isAssetLikedRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const assetsLike = await this.assetsLikesRepository.getIsLikedAsset(
      identifiers,
    );
    return assetsLike?.groupBy((asset) => asset.identifier);
  }
}
