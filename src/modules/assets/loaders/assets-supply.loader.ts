import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { AssetsSupplyRedisHandler } from './assets-supply.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsSupplyLoader extends BaseProvider<string> {
  constructor(
    private assetsSupplyRedisHandler: AssetsSupplyRedisHandler,
    private apiService: ElrondApiService,
  ) {
    super(
      assetsSupplyRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      '&withSupply=true&fields=identifier,supply',
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  public batchSupplyInfo = async (identifiers: string[], data: any) => {
    return this.assetsSupplyRedisHandler.batchSupplyInfo(identifiers, data);
  };
}
