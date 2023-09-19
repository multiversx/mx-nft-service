import DataLoader = require('dataloader');
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { InternalMarketplaceRedisHandler } from './internal-marketplace.redis-handler';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class InternalMarketplaceProvider extends BaseProvider<string> {
  constructor(subdomainRedisHandler: InternalMarketplaceRedisHandler, private persistenceService: PersistenceService) {
    super(subdomainRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(collections: string[]) {
    const marketplace = await this.persistenceService.getMarketplaceByCollections(collections);
    return marketplace?.groupBy((subdomainCollection: { collectionIdentifier: any }) => subdomainCollection.collectionIdentifier);
  }
}
