import { Injectable } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';

@Injectable()
export class CollectionStatsServiceMock {
  async getStats(identifier: string): Promise<any> {
    new CollectionStatsEntity({
      activeAuctions: 2,
      auctionsEnded: 4,
      maxPrice: '1111111111111',
      minPrice: '1000000000000',
      saleAverage: '11111111100',
      volumeTraded: '211111111110',
    });
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
