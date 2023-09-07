import DataLoader = require('dataloader');
import { MxApiService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { AssetScamInfoProvider } from './assets-scam-info.loader';
import { AssetsRedisHandler } from './assets.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsProvider extends BaseProvider<string> {
  constructor(assetstRedisHandler: AssetsRedisHandler, private assetScamLoader: AssetScamInfoProvider, private apiService: MxApiService) {
    super(assetstRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(identifiers, 0);
    const nftsGrouped = nfts?.groupBy((asset) => asset.identifier);

    if (identifiers && identifiers.length > 0) this.assetScamLoader.batchScamInfo(identifiers, nftsGrouped);

    return nftsGrouped;
  }
}
