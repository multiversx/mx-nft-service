import { EntityRepository, Repository } from 'typeorm';
import { MarketplaceEntity } from './marketplace.entity';

@EntityRepository(MarketplaceEntity)
export class MarketplaceRepository extends Repository<MarketplaceEntity> {
  async getMarketplaces(): Promise<[MarketplaceEntity[], number]> {
    return await this.findAndCount();
  }

  async getMarketplaceByAddress(address: string): Promise<MarketplaceEntity> {
    return await this.findOne({
      where: {
        address,
      },
    });
  }

  async getMarketplaceByKey(key: string): Promise<MarketplaceEntity> {
    return await this.findOne({
      where: {
        key,
      },
    });
  }

  async getMarketplacesByKeys(
    marketplaceKeys: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.createQueryBuilder('marketplaces')
      .where('`key` IN(:...marketplaceKeys)', {
        marketplaceKeys: marketplaceKeys,
      })
      .getMany();
  }

  async getMarketplacesByAddresses(
    addresses: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.createQueryBuilder('fm')
      .select('fm.address as address')
      .addSelect('fm.url as url')
      .addSelect('fm.name as name')
      .addSelect('fm.key as `key`')
      .where('fm.address IN(:...addresses)', {
        addresses: addresses,
      })
      .execute();
  }

  async updateMarketplaceLastIndexTimestamp(
    address: string,
    lastIndexTimestamp: number,
  ): Promise<void> {
    await this.update(
      { address: address },
      { latest_index_timestamp: lastIndexTimestamp },
    );
  }
}
