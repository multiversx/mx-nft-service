import { EntityManager, EntityRepository } from 'typeorm';
import { CollectionStatsEntity } from './collection-stats';
import { getCollectionStats } from './collection-stats.querries';

@EntityRepository()
export class CollectionStatsRepository {
  constructor(public readonly manager: EntityManager) {}
  async getStats(identifier: string): Promise<CollectionStatsEntity> {
    const response = await this.manager.query(getCollectionStats(identifier));
    console.log(response);
    return response?.length > 0 ? response[0] : new CollectionStatsEntity();
  }
}
