import { EntityRepository, Repository } from 'typeorm';
import { getAccountStatsQuery } from '../account-stats/stats.querries';
import { AssetLikeEntity } from './assets-likes.entity';

@EntityRepository(AssetLikeEntity)
export class AccountStatsRepository extends Repository<AssetLikeEntity> {
  async getAccountStats(addresses: string[]): Promise<any> {
    return await this.query(getAccountStatsQuery(addresses));
  }
}
