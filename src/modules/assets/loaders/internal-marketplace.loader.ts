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
      .createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .innerJoin('marketplaces', 'm', 'm.id=mc.marketplaceId')
      .where(
        `mc.collectionIdentifier IN(${collections.map(
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
