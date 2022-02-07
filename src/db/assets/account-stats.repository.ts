import { Entity, EntityRepository, Repository } from 'typeorm';
import { getAccountStatsQuery } from '../auctions/sql.queries';
import { AssetLikeEntity } from './assets-likes.entity';

@EntityRepository(AssetLikeEntity)
export class AccountStatsRepository extends Repository<AssetLikeEntity> {
  async getAccountStats(addresses: string[]): Promise<any> {
    return await this.query(getAccountStatsQuery(addresses));
  }
}
