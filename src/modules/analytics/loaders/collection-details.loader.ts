import { Injectable, Scope } from '@nestjs/common';
import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { CollectionDetailsRedisHandler } from './collection-details.redis-handler';
import { CollectionsGetterService } from 'src/modules/nftCollections/collections-getter.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class CollectionDetailsProvider extends BaseProvider<string> {
  constructor(private collectionsService: CollectionsGetterService, collectionDetailsRedisHandler: CollectionDetailsRedisHandler) {
    super(collectionDetailsRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  getData = async (keys: string[]): Promise<any[]> => {
    const response = await this.collectionsService.getCollectionsByIdentifiers(keys);
    return response?.groupBy((item) => item.collection);
  };
}
