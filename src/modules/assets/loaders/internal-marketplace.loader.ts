import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { InternalMarketplaceRedisHandler } from './internal-marketplace.redis-handler';
import { MarketplaceCollectionEntity } from 'src/db/marketplaces';

@Injectable({
  scope: Scope.REQUEST,
})
export class InternalMarketplaceProvider extends BaseProvider<string> {
  constructor(subdomainRedisHandler: InternalMarketplaceRedisHandler) {
    super(
      subdomainRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(collections: string[]) {
    const marketplace = await getRepository(MarketplaceCollectionEntity)
      .createQueryBuilder('sc')
      .select('sc.collectionIdentifier as collectionIdentifier')
      .addSelect('sd.name as name')
      .addSelect('sd.url as url')
      .innerJoin('marketplaces', 'sd', 'sd.id=sc.marketplaceId')
      .where(
        `sc.collectionIdentifier IN(${collections.map(
          (value) => `'${value}'`,
        )})`,
      )
      .execute();
    return marketplace?.groupBy(
      (subdomainCollection: { collectionIdentifier: any }) =>
        subdomainCollection.collectionIdentifier,
    );
  }
}
