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
}
