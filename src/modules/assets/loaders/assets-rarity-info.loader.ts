import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetRarityInfoRedisHandler } from './assets-rarity-info.redis-handler';
import { MxApiService } from 'src/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetRarityInfoProvider extends BaseProvider<string> {
  constructor(private assetRarityInfoRedisHandler: AssetRarityInfoRedisHandler, private mxApiService: MxApiService) {
    super(assetRarityInfoRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const nftRarities = await this.mxApiService.getBulkNftRaritiesByIdentifiers(identifiers);
    return nftRarities?.groupBy((nft) => nft.identifier);
  }

  public batchRarity = async (identifiers: string[], data: any) => {
    return this.assetRarityInfoRedisHandler.batchRarity(identifiers, data);
  };
}
