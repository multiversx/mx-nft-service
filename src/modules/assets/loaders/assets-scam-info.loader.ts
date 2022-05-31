import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { AssetScamInfoRedisHandler } from './assets-scam-info.redis-handler';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetScamInfoProvider extends BaseProvider<string> {
  constructor(
    private assetScamInfoRedisHandler: AssetScamInfoRedisHandler,
    private apiService: ElrondApiService,
  ) {
    super(
      assetScamInfoRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      '&fields=identifier,scamInfo',
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  public batchScamInfo = async (identifiers: string[], data: any) => {
    return this.assetScamInfoRedisHandler.batchScamInfo(identifiers, data);
  };
}
