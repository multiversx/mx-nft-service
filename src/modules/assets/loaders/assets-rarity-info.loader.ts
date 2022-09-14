import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetRarityInfoRedisHandler } from './assets-rarity-info.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetRarityInfoProvider extends BaseProvider<string> {
  constructor(
    private assetRarityInfoRedisHandler: AssetRarityInfoRedisHandler,
    private persistenceService: PersistenceService,
  ) {
    super(
      assetRarityInfoRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nftRarities = await this.persistenceService.getBulkRarities(
      identifiers,
    );
    return nftRarities?.groupBy((rarity) => rarity.identifier);
  }

  public batchRarity = async (identifiers: string[], data: any) => {
    return this.assetRarityInfoRedisHandler.batchRarity(identifiers, data);
  };
}
