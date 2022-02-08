import { EntityRepository, Repository } from 'typeorm';
import { AssetLikeEntity } from '../assets/assets-likes.entity';
import { AccountStatsEntity } from './account-stats.entity';
import {
  getAccountClaimableCount,
  getAccountStatsQuery,
} from './stats.querries';

@EntityRepository(AssetLikeEntity)
export class AccountStatsRepository extends Repository<AccountStatsEntity> {
  async getAccountStats(address: string): Promise<any> {
    return await this.query(getAccountStatsQuery(address));
  }

  async getAccountClaimableCount(address: string): Promise<any> {
    return await this.query(getAccountClaimableCount(address));
  }
}
