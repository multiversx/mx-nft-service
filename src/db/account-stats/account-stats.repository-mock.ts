import { Repository } from 'typeorm';
import { AuctionEntity } from '../auctions';
import { AccountStatsEntity } from './account-stats';

export class AccountStatsRepositoryMock extends Repository<AuctionEntity> {
  async getPublicAccountStats(address: string): Promise<AccountStatsEntity> {
    return new AccountStatsEntity({
      auctions: '2',
      orders: '0',
      biddingBalance: '0',
      address: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
    });
  }

  async getOwnerAccountStats(address: string): Promise<AccountStatsEntity> {
    return new AccountStatsEntity({
      auctions: '3',
      orders: '0',
      biddingBalance: '0',
      address: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
    });
  }

  async getAccountClaimableCount(address: string): Promise<number> {
    return 4;
  }
}
