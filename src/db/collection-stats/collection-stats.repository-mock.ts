import { CollectionStatsEntity } from './collection-stats';

export class CollectionStatsRepositoryMock {
  async getStats(_identifier: string): Promise<CollectionStatsEntity> {
    return new CollectionStatsEntity({
      activeAuctions: 2,
      auctionsEnded: 4,
      maxPrice: '1111111111111',
      minPrice: '1000000000000',
      saleAverage: '11111111100',
      volumeTraded: '211111111110',
    });
  }
}
