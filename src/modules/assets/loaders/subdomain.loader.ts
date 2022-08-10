import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { Injectable, Scope } from '@nestjs/common';
import { BaseProvider } from 'src/modules/common/base.loader';
import { SubdomainsRedisHandler } from './subdomain.redis-handler';
import { SubdomainCollectionEntity } from 'src/db/subdomains/subdomain-collection.entity';

@Injectable({
  scope: Scope.REQUEST,
})
export class SubdomainsProvider extends BaseProvider<string> {
  constructor(subdomainRedisHandler: SubdomainsRedisHandler) {
    super(
      subdomainRedisHandler,
      new DataLoader(async (keys: string[]) => await this.batchLoad(keys)),
    );
  }

  async getData(collections: string[]) {
    const subdomain = await getRepository(SubdomainCollectionEntity)
      .createQueryBuilder('sc')
      .select('sc.collectionIdentifier as collectionIdentifier')
      .addSelect('sd.name as name')
      .addSelect('sd.url as url')
      .innerJoin('subdomains', 'sd', 'sd.id=sc.subdomainId')
      .where(
        `sc.collectionIdentifier IN(${collections.map(
          (value) => `'${value}'`,
        )})`,
      )
      .execute();
    return subdomain?.groupBy(
      (subdomainCollection: { collectionIdentifier: any }) =>
        subdomainCollection.collectionIdentifier,
    );
  }
}
