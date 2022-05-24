import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityManager, EntityRepository } from 'typeorm';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AccountStatsEntity } from './account-stats';
import {
  getOwnerAccountStatsQuery,
  getPublicAccountStatsQuery,
} from './stats.querries';

@EntityRepository()
export class AccountStatsRepository {
  constructor(public readonly manager: EntityManager) {}
  async getPublicAccountStats(address: string): Promise<AccountStatsEntity> {
    const response = await this.manager.query(
      getPublicAccountStatsQuery(address),
    );
    console.log('getPublicAccountStats', { response });
    return response;
  }

  async getOnwerAccountStats(address: string): Promise<AccountStatsEntity> {
    const response = await this.manager.query(
      getOwnerAccountStatsQuery(address),
    );
    console.log('getOnwerAccountStats', { response });
    return response;
  }

  async getAccountClaimableCount(address: string): Promise<number> {
    return await this.manager
      .createQueryBuilder<AuctionEntity>(AuctionEntity, 'a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' AND a.type <> 'SftOnePerPayment' AND
      ((o.ownerAddress = '${address}' AND o.status='active'))`,
      )
      .groupBy('a.id')
      .getCount();
  }
}
