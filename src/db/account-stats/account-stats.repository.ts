import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityRepository, Repository } from 'typeorm';
import { AuctionEntity } from '../auctions';
import {
  getOwnerAccountStatsQuery,
  getPublicAccountStatsQuery,
} from './stats.querries';

@EntityRepository(AuctionEntity)
export class AccountStatsRepository extends Repository<AuctionEntity> {
  async getPublicAccountStats(address: string): Promise<any> {
    return await this.query(getPublicAccountStatsQuery(address));
  }

  async getOnwerAccountStats(address: string): Promise<any> {
    return await this.query(getOwnerAccountStatsQuery(address));
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
