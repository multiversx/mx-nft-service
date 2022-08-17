import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { FeaturedMarketplaceRedisHandler } from './featured-marketplace.redis-handler';
import { MarketplaceEntity } from 'src/db/marketplaces';

@Injectable({
  scope: Scope.REQUEST,
})
export class FeaturedMarketplaceProvider extends BaseProvider<string> {
  constructor(
    featuredMarketplaceRedisHandler: FeaturedMarketplaceRedisHandler,
  ) {
    super(
      featuredMarketplaceRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(addresses: string[]) {
    const featuredMarketplace = await getRepository(MarketplaceEntity)
      .createQueryBuilder('fm')
      .select('fm.address as address')
      .addSelect('fm.url as url')
      .addSelect('fm.name as name')
      .addSelect('fm.key as key')
      .where(`fm.address IN(${addresses.map((value) => `'${value}'`)})`)
      .execute();
    return featuredMarketplace?.groupBy((asset) => asset.address);
  }
}
