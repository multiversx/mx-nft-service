import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { EntityManager, EntityRepository } from 'typeorm';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AccountStatsEntity } from './account-stats';
import {
  getOwnerAccountStatsForMarketplaceQuery,
  getOwnerAccountStatsQuery,
  getPublicAccountStatsForMarketplaceQuery,
  getPublicAccountStatsQuery,
} from './stats.querries';

@EntityRepository()
export class AccountStatsRepository {
  constructor(public readonly manager: EntityManager) {}
  async getPublicAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    if (marketplaceKey) {
      const response = await this.manager.query(
        getPublicAccountStatsForMarketplaceQuery(address, marketplaceKey),
      );
      return response?.length > 0 ? response[0] : new AccountStatsEntity();
    }
    const response = await this.manager.query(
      getPublicAccountStatsQuery(address),
    );

    return response?.length > 0 ? response[0] : new AccountStatsEntity();
  }

  async getOnwerAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    if (marketplaceKey) {
      const response = await this.manager.query(
        getOwnerAccountStatsForMarketplaceQuery(address, marketplaceKey),
      );
      return response?.length > 0 ? response[0] : new AccountStatsEntity();
    }
    const response = await this.manager.query(
      getOwnerAccountStatsQuery(address),
    );
    return response?.length > 0 ? response[0] : new AccountStatsEntity();
  }

  async getAccountClaimableCount(
    address: string,
    marketplaceKey: string = null,
  ): Promise<number> {
    if (marketplaceKey) {
      return await this.manager
        .createQueryBuilder<AuctionEntity>(AuctionEntity, 'a')
        .innerJoin('orders', 'o', 'o.auctionId=a.id')
        .where(
          `a.status = '${AuctionStatusEnum.Claimable}' AND a.marketplaceKey = :marketplaceKey AND a.type <> 'SftOnePerPayment' 
          AND ((o.ownerAddress = :ownerAddress AND o.status='active'))`,
          {
            marketplaceKey: marketplaceKey,
            ownerAddress: address,
          },
        )
        .groupBy('a.id')
        .getCount();
    }
    return await this.manager
      .createQueryBuilder<AuctionEntity>(AuctionEntity, 'a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' AND a.type <> 'SftOnePerPayment' AND
      ((o.ownerAddress = :ownerAddress AND o.status='active'))`,
        {
          ownerAddress: address,
        },
      )
      .groupBy('a.id')
      .getCount();
  }
}
