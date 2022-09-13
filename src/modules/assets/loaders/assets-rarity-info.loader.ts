import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetRarityInfoRedisHandler } from './assets-rarity-info.redis-handler';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetRarityInfoProvider extends BaseProvider<string> {
  constructor(
    private assetRarityInfoRedisHandler: AssetRarityInfoRedisHandler,
    private rarityRepository: NftRarityRepository,
  ) {
    super(
      assetRarityInfoRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nftRarities = await this.rarityRepository.getBulkRarities(
      identifiers,
    );
    return nftRarities?.groupBy((rarity) => rarity.identifier);
  }

  public batchRarity = async (identifiers: string[], data: any) => {
    return this.assetRarityInfoRedisHandler.batchRarity(identifiers, data);
  };
}
