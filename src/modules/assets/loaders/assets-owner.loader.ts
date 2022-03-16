import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetsOwnerRedisHandler } from './assets-owner.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsOwnerLoader extends BaseProvider<string> {
  constructor(
    private assetsOwnerRedisHandler: AssetsOwnerRedisHandler,
    private apiService: ElrondApiService,
  ) {
    super(
      assetsOwnerRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      '&withOwner=true&fields=identifier,owner',
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  public batchOwnerAddress = async (identifiers: string[], data: any) => {
    return this.assetsOwnerRedisHandler.batchOwner(identifiers, data);
  };
}
