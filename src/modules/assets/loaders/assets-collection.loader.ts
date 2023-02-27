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
  constructor(
    assetsRedisHandler: AssetsCollectionsRedisHandler,
    private apiService: MxApiService,
  ) {
    super(
      assetsRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const page = parseInt(identifiers[0].split('_')[1]);
    const size = parseInt(identifiers[0].split('_')[2]);
    const nftsPromises = identifiers.map((identifier) =>
      this.apiService.getNftsAndCount(
        new AssetsQuery()
          .addCollection(identifier.split('_')[0])
          .addPageSize(page, size)
          .build(),
        new AssetsQuery().addCollection(identifier.split('_')[0]).build(),
      ),
    );

    const nftsPromisesResponse = await Promise.all(nftsPromises);
    let response: any = {};
    for (const [nfts, count] of nftsPromisesResponse) {
      console.log('here ', { nfts, identifiers });
      const key = `${nfts[0]?.collection}_${page}_${size}`;
      response[key] = { nfts: nfts, count: count };
    }
    return response;
  }
}
