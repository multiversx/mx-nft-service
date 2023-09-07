import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { AssetsQuery } from 'src/modules/assets/assets-query';
import { CollectionAssetsCountRedisHandler } from './collection-assets-count.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class CollectionAssetsCountProvider extends BaseProvider<string> {
  constructor(collectionAssetsHandler: CollectionAssetsCountRedisHandler, private apiService: MxApiService) {
    super(collectionAssetsHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const getCountPromises = identifiers.map((identifier) =>
      this.apiService.getNftsCountForCollection(this.getQueryForCollection(identifier), identifier),
    );

    const nftsCountResponse = await Promise.all(getCountPromises);
    return nftsCountResponse?.groupBy((item) => item.key);
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery().addCollection(identifier).build();
  }
}
