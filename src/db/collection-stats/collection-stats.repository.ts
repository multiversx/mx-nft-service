import { elrondConfig } from 'src/config';
import { EntityManager, EntityRepository } from 'typeorm';
import { CollectionStatsEntity } from './collection-stats';
import { getCollectionStats } from './collection-stats.querries';

@EntityRepository()
export class CollectionStatsRepository {
  constructor(public readonly manager: EntityManager) {}
  async getStats(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = elrondConfig.egld,
  ): Promise<CollectionStatsEntity> {
    const response = await this.manager.query(
      getCollectionStats(identifier, marketplaceKey, paymentToken),
    );
    return response?.length > 0 ? response[0] : new CollectionStatsEntity();
  }
}
