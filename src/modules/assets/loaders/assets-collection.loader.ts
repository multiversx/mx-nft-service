import DataLoader = require('dataloader');
import { ElrondApiService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetsQuery } from '../assets-query';
import { AssetsCollectionRedisHandler } from './assets-collection.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsCollectionsProvider extends BaseProvider<string> {
  constructor(
    assetsRedisHandler: AssetsCollectionRedisHandler,
    private apiService: ElrondApiService,
  ) {
    super(
      assetsRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const nftsPromises = identifiers.map((identifier) =>
      this.apiService.getAllNfts(
        new AssetsQuery().addCollection(identifier).addPageSize(0, 10).build(),
      ),
    );

    const nftsResponse = await Promise.all(nftsPromises);
    let nftsFull = [];
    for (const nfts of nftsResponse) {
      nftsFull = [...nftsFull, ...nfts];
    }
    const nftsGrouped = nftsFull?.groupBy((asset) => asset.collection);

    return nftsGrouped;
  }
}
