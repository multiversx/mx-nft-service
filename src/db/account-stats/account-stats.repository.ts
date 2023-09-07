import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityManager } from 'typeorm';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AccountStatsEntity } from './account-stats';
import { getBiddingBalanceQuery, getOwnerAccountStatsQuery, getPublicAccountStatsQuery } from './stats.querries';
import { getMarketplaceKeyFilter } from '../collection-stats/sqlUtils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountStatsRepository {
  constructor(public readonly manager: EntityManager) {}
  async getPublicAccountStats(address: string, marketplaceKey: string = null): Promise<AccountStatsEntity> {
    const response = await this.manager.query(getPublicAccountStatsQuery(address, marketplaceKey));
    return response?.length > 0 ? response[0] : new AccountStatsEntity();
  }

  async getBiddingBalance(address: string, marketplaceKey: string = null): Promise<[{ biddingBalance: string; priceToken: string }]> {
    return await this.manager.query(getBiddingBalanceQuery(address, marketplaceKey));
  }

  async getOwnerAccountStats(address: string, marketplaceKey: string = null): Promise<AccountStatsEntity> {
    const response = await this.manager.query(getOwnerAccountStatsQuery(address, marketplaceKey));
    return response?.length > 0 ? response[0] : new AccountStatsEntity();
  }

  async getAccountClaimableCount(address: string, marketplaceKey: string = null): Promise<number> {
    return await this.manager
      .createQueryBuilder<AuctionEntity>(AuctionEntity, 'a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' 
        ${getMarketplaceKeyFilter('a', marketplaceKey)} 
        AND a.type <> 'SftOnePerPayment' AND
      ((o.ownerAddress = :ownerAddress AND o.status='active'))`,
        {
          ownerAddress: address,
        },
      )
      .groupBy('a.id')
      .getCount();
  }
}
