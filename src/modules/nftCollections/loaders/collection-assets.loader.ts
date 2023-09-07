import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { CollectionAssetsRedisHandler } from './collection-assets.redis-handler';
import { MxApiService } from 'src/common/services/mx-communication';
import { AssetsQuery } from 'src/modules/assets/assets-query';

@Injectable({
  scope: Scope.REQUEST,
})
export class CollectionAssetsProvider extends BaseProvider<string> {
  constructor(collectionAssetsHandler: CollectionAssetsRedisHandler, private apiService: MxApiService) {
    super(collectionAssetsHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const getNftsPromises = identifiers.map((identifier) => {
      const query = new AssetsQuery()
        .addCollection(identifier)
        .addPageSize(0, 10)
        .addFields(['media', 'identifier', 'collection', 'isNsfw', 'scamInfo'])
        .build();
      return this.apiService.getAllNfts(query);
    });

    const getNftsResponse = await Promise.all(getNftsPromises);

    const nftsGroupByCollection = getNftsResponse.map((nftArray) => nftArray.groupBy((nft) => nft.collection));
    return this.mapKeyArrayObject(nftsGroupByCollection);
  }

  private mapKeyArrayObject(nftsGroupByCollection: any[]) {
    return nftsGroupByCollection.reduce((o, t) => Object.assign(o, t));
  }
}
