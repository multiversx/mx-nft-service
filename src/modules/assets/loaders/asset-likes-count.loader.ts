import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { AssetLikesProviderRedisHandler } from './asset-likes-count.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetLikesProvider extends BaseProvider<string> {
  constructor(assetLikesProviderRedisHandler: AssetLikesProviderRedisHandler, private persistenceService: PersistenceService) {
    super(assetLikesProviderRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const assetsLike = await this.persistenceService.getBulkAssetLikesCount(identifiers);
    return assetsLike?.groupBy((asset: { identifier: any }) => asset.identifier);
  }
}
