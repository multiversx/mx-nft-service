import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { IsAssetLikedRedisHandler } from './asset-is-liked.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class IsAssetLikedProvider extends BaseProvider<string> {
  constructor(isAssetLikedRedisHandler: IsAssetLikedRedisHandler, private persistenceService: PersistenceService) {
    super(isAssetLikedRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const assetsLike = await this.persistenceService.getIsLikedAsset(identifiers);
    return assetsLike?.groupBy((asset) => asset.identifier);
  }
}
