import { Injectable } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';

@Injectable()
export class AccountsStatsServiceMock {
  async getStats(address: string, isOwner: boolean): Promise<any> {
    if (isOwner) {
      return this.getStatsForOwner(address);
    } else return this.getPublicStats(address);
  }

  private async getPublicStats(address: string): Promise<any> {
    return new AccountStatsEntity({
      auctions: '2',
      orders: '0',
      biddingBalance: '0',
      address: address,
    });
  }

  private async getStatsForOwner(address: string): Promise<any> {
    return new AccountStatsEntity({
      auctions: '3',
      orders: '0',
      biddingBalance: '0',
      address: address,
    });
  }

  async getClaimableCount(_address: string): Promise<number> {
    return Promise.resolve(4);
  }

  async getCollectedCount(_address: string): Promise<number> {
    return Promise.resolve(4);
  }

  async getCollectionsCount(_address: string): Promise<number> {
    return Promise.resolve(2);
  }
  async getCreationsCount(_address: string): Promise<any> {
    return Promise.resolve(10);
  }
}
