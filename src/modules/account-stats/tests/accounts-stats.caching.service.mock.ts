import { Injectable } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';

@Injectable()
export class AccountsStatsCachingServiceMock {
  public async getPublicStats(_address: string, _getAccountStats: () => any): Promise<AccountStatsEntity> {
    return new AccountStatsEntity({
      auctions: '2',
      orders: '0',
      biddingBalance: '0',
      address: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
    });
  }

  public async getStatsForOwner(_address: string, _getAccountStats: () => any): Promise<AccountStatsEntity> {
    return new AccountStatsEntity({
      address: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      auctions: '3',
      biddingBalance: '0',
      orders: '0',
    });
  }

  public async getClaimableCount(_address: string, _getClaimableCount: () => any): Promise<number> {
    return Promise.resolve(4);
  }

  public async getCollectedCount(_address: string, _getCollectedCount: () => any): Promise<number> {
    return Promise.resolve(4);
  }

  public async getCollectionsCount(_address: string, _getCollectionsCount: () => any): Promise<number> {
    return Promise.resolve(2);
  }

  public async getCreationsCount(_address: string, _getCreationsCount: () => any): Promise<number> {
    return Promise.resolve(10);
  }
}
