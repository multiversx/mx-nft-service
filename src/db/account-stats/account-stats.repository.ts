import { response } from 'express';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityRepository, Repository } from 'typeorm';
import { AuctionEntity } from '../auctions';
import { AccountStatsEntity } from './account-stats.entity';
import {
  getOwnerAccountStatsQuery,
  getPublicAccountStatsQuery,
} from './stats.querries';

@EntityRepository(AuctionEntity)
export class AccountStatsRepository extends Repository<AuctionEntity> {
  async getPublicAccountStats(address: string): Promise<AccountStatsEntity> {
    const response = await this.query(getPublicAccountStatsQuery(address));
    console.log(response[0]);
    return response;
  }

  async getOnwerAccountStats(address: string): Promise<AccountStatsEntity> {
    const response = await this.query(getOwnerAccountStatsQuery(address));
    console.log(response);
    return response;
  }

  async getAccountClaimableCount(address: string): Promise<number> {
    console.log('here');
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
