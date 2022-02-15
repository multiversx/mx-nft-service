import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityRepository, Repository } from 'typeorm';
import { AuctionEntity } from '../auctions';
import { getAccountStatsQuery } from './stats.querries';

@EntityRepository(AuctionEntity)
export class AccountStatsRepository extends Repository<AuctionEntity> {
  async getAccountStats(address: string): Promise<any> {
    return await this.query(getAccountStatsQuery(address));
  }

  async getAccountClaimableCount(address: string): Promise<any> {
    return await this.createQueryBuilder('a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' AND a.type <> 'SftOnePerPayment' AND 
      ((o.ownerAddress = '${address}' AND o.status='active'))`,
      )
      .groupBy('a.id')
      .getCount();
  }
}
