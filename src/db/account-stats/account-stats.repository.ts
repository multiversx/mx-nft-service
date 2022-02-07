import { EntityRepository, Repository } from 'typeorm';
import { AccountStatsEntity } from './account-stats.entity';
import { getAccountStatsQuery } from './stats.querries';

@EntityRepository(AccountStatsEntity)
export class AccountStatsRepository extends Repository<AccountStatsEntity> {
  async getAccountStats(addresses: string[]): Promise<any> {
    return await this.query(getAccountStatsQuery(addresses));
  }
}
