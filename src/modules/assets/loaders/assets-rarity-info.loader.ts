import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetRarityInfoRedisHandler } from './assets-rarity-info.redis-handler';
import { getRepository } from 'typeorm';
import { NftRarityEntity } from 'src/db/nft-rarity';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetRarityInfoProvider extends BaseProvider<string> {
  constructor(
    private assetRarityInfoRedisHandler: AssetRarityInfoRedisHandler,
  ) {
    super(
      assetRarityInfoRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nftRarities = await getRepository(NftRarityEntity)
      .createQueryBuilder()
      .select('identifier, score, `rank`')
      .where(`identifier IN(:identifiers)`, {
        identifiers: identifiers,
      })
      .execute();
    return nftRarities?.groupBy((rarity) => rarity.identifier);
  }

  public batchRarity = async (identifiers: string[], data: any) => {
    return this.assetRarityInfoRedisHandler.batchRarity(identifiers, data);
  };
}
