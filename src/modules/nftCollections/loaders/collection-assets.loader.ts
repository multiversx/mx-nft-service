import DataLoader = require('dataloader');
import { BaseProvider } from 'src/modules/common/base.loader';
import { Injectable, Scope } from '@nestjs/common';
import { CollectionAssetsRedisHandler } from './collection-assets.redis-handler';
import { ElrondApiService } from 'src/common/services/elrond-communication';
import { AssetsQuery } from 'src/modules/assets/assets-query';

@Injectable({
  scope: Scope.REQUEST,
})
export class CollectionAssetsProvider extends BaseProvider<string> {
  constructor(
    collectionAssetsHandler: CollectionAssetsRedisHandler,
    private apiService: ElrondApiService,
  ) {
    super(
      collectionAssetsHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(identifiers: string[]) {
    const promises = identifiers.map((identifier) =>
      this.apiService.getAllNfts(
        `${this.getQueryForCollection(
          identifier,
        )}&fields=media,identifier,collection`,
      ),
    );

    const promisesResponse = await Promise.all(promises);

    const rest = promisesResponse.map((promise) =>
      promise.groupBy((nft) => nft.collection),
    );
    const obj = rest.reduce((o, t) => Object.assign(o, t));
    return obj;
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery()
      .addCollection(identifier)
      .addPageSize(0, 4)
      .build();
  }
}
