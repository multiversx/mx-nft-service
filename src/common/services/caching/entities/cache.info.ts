import { TimeConstants } from 'src/utils/time-utils';

export class CacheInfo {
  key: string = '';
  ttl: number = TimeConstants.oneSecond * 6;

  static AllCollections: CacheInfo = {
    key: 'allCollections',
    ttl: TimeConstants.oneHour,
  };

  static AuctionsEndingToday: CacheInfo = {
    key: 'auctionsEndingToday',
    ttl: TimeConstants.oneHour,
  };

  static AuctionsEndingInAMonth: CacheInfo = {
    key: 'auctionsEndingInAMonth',
    ttl: TimeConstants.oneHour,
  };
  static MarketplaceAuctions: CacheInfo = {
    key: 'marketplaceAuctions',
    ttl: TimeConstants.oneHour,
  };

  static Campaigns: CacheInfo = {
    key: 'allCampaigns',
    ttl: TimeConstants.oneHour,
  };
}
