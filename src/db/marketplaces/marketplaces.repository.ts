import { EntityRepository, Repository } from 'typeorm';
import { MarketplaceEntity } from './marketplace.entity';

@EntityRepository(MarketplaceEntity)
export class MarketplaceRepository extends Repository<MarketplaceEntity> {
  async getMarketplaces(): Promise<[MarketplaceEntity[], number]> {
    return await this.findAndCount();
  }
}
