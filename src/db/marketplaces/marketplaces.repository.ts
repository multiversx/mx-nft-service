import { EntityRepository, Repository } from 'typeorm';
import { MarketplaceEntity } from './marketplace.entity';

@EntityRepository(MarketplaceEntity)
export class MarketplaceRepository extends Repository<MarketplaceEntity> {
  async getMarketplaces(): Promise<[MarketplaceEntity[], number]> {
    return await this.findAndCount();
  }

  async getMarketplaceByAddressAndCollection(
    collection: string,
    address: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.createQueryBuilder('mc')
      .select('mc.collectionIdentifier as collectionIdentifier')
      .addSelect('m.name as name')
      .addSelect('m.url as url')
      .addSelect('m.address as address')
      .addSelect('m.key as key')
      .innerJoin('marketplaces', 'm', 'm.id=mc.marketplaceId')
      .where(
        `mc.collectionIdentifier = '${collection}' and m.address= '${address}'`,
      )
      .execute();
  }
}
