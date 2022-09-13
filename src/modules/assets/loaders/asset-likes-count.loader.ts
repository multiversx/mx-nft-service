import DataLoader = require('dataloader');
import { AssetsLikesRepository } from 'src/db/assets';
import { BaseProvider } from '../../common/base.loader';
import { AssetLikesProviderRedisHandler } from './asset-likes-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetLikesProvider extends BaseProvider<string> {
  constructor(
    assetLikesProviderRedisHandler: AssetLikesProviderRedisHandler,
    private assetsLikesRepository: AssetsLikesRepository,
  ) {
    super(
      assetLikesProviderRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const assetsLike =
      await this.assetsLikesRepository.getAssetLikesCountForIdentifiers(
        identifiers,
      );
    return assetsLike?.groupBy(
      (asset: { identifier: any }) => asset.identifier,
    );
  }
}
