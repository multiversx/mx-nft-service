export class CollectionStatsEntity {
  identifier: string;
  activeAuctions: number;
  auctionsEnded: number;
  maxPrice: string;
  minPrice: string;
  saleAverage: string;
  volumeTraded: string;

  constructor(init?: Partial<CollectionStatsEntity>) {
    Object.assign(this, init);
  }
}
