import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { AssetScamInfoProvider } from './assets-scam-info.loader';
import { AssetsRedisHandler } from './assets.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsProvider extends BaseProvider<string> {
  constructor(
    assetstRedisHandler: AssetsRedisHandler,
    private assetScamLoader: AssetScamInfoProvider,
    private apiService: ElrondApiService,
  ) {
    super(
      assetstRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    if (identifiers.includes('NFT-b4996c-0b')) {
      console.log(`Loading NFT Info: ${identifiers.join(', ')}. Length: ${identifiers.length}`);
    }
    const nfts = await this.apiService.getNftsByIdentifiers(
      identifiers,
      0,
      'withOwner=true',
    );

    if (identifiers.includes('NFT-b4996c-0b')) {
      console.log('NFT Info', nfts);
    }

    const nftsGrouped = nfts?.groupBy((asset) => asset.identifier);

    this.assetScamLoader.batchScamInfo(identifiers, nftsGrouped);

    if (identifiers.includes('NFT-b4996c-0b')) {
      console.log('nftsGrouped', nftsGrouped);
    }

    return nftsGrouped;
  }
}
