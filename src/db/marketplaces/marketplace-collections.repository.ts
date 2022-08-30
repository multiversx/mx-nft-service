import { EntityRepository, Repository } from 'typeorm';
import { MarketplaceCollectionEntity } from './marketplace-collection.entity';
import { MarketplaceEntity } from './marketplace.entity';

@EntityRepository(MarketplaceCollectionEntity)
export class MarketplaceCollectionsRepository extends Repository<MarketplaceEntity> {
  async getMarketplaceByAddressAndCollection(
    collection: string,
    address: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as `key`')
      .innerJoin('marketplaces', 'm', 'm.id=mc.marketplaceId')
      .where(
        `mc.collectionIdentifier = '${collection}' and m.address= '${address}'`,
      )
      .execute();
  }

  async getMarketplaceByCollection(
    collection: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as `key`')
      .innerJoin('marketplaces', 'm', 'm.id=mc.marketplaceId')
      .where(`mc.collectionIdentifier = '${collection}'`)
      .execute();
  }

  async getCollectionsByMarketplace(
    marketplaceKey: string,
  ): Promise<MarketplaceCollectionEntity[]> {
    return await this.createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .innerJoin('marketplaces', 'm', 'm.id=mc.marketplaceId')
      .where(`m.key = '${marketplaceKey}'`)
      .execute();
  }
}
