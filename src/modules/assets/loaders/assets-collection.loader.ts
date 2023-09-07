import DataLoader = require('dataloader');
import { MxApiService } from 'src/common';
import { BaseProvider } from '../../common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { AssetsQuery } from '../assets-query';
import { AssetsCollectionsRedisHandler } from './assets-collection.redis-handler';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetsCollectionsProvider extends BaseProvider<string> {
  constructor(assetsRedisHandler: AssetsCollectionsRedisHandler, private apiService: MxApiService) {
    super(assetsRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const nftsPromises = identifiers.map((identifier) =>
      this.apiService.getNftsAndCount(
        new AssetsQuery().addCollection(identifier).addPageSize(0, 10).build(),
        new AssetsQuery().addCollection(identifier).build(),
      ),
    );

    const nftsPromisesResponse = await Promise.all(nftsPromises);
    let response: any = {};
    for (const [nfts, count] of nftsPromisesResponse) {
      const key = nfts[0]?.collection;
      response[key] = { nfts: nfts, count: count };
    }
    return response;
  }
}
