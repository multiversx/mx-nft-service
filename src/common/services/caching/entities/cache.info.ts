import { TimeConstants } from 'src/utils/time-utils';

export class CacheInfo {
  key: string = '';
  ttl: number = TimeConstants.oneSecond * 6;

  static AllCollections: CacheInfo = {
    key: 'allCollections',
    ttl: TimeConstants.oneHour,
  };

  static AllMarketplaces: CacheInfo = {
    key: 'allMarketplaces',
    ttl: TimeConstants.oneHour,
  };

  static AuctionsEndingToday: CacheInfo = {
    key: 'auctionsEndingToday',
    ttl: TimeConstants.oneHour,
  };

  static TopAuctionsOrderByNoBids: CacheInfo = {
    key: 'auctionsOrderByNoBids',
    ttl: TimeConstants.oneMinute * 10,
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

  static AuctionTags: CacheInfo = {
    key: 'auctionTags',
    ttl: 5 * TimeConstants.oneMinute,
  };

  static NftTags: CacheInfo = {
    key: 'nftTags',
    ttl: 5 * TimeConstants.oneMinute,
  };

  static AllTokens: CacheInfo = {
    key: 'allTokens',
    ttl: 10 * TimeConstants.oneMinute,
  };

  static EgldToken: CacheInfo = {
    key: 'egldTokens',
    ttl: 10 * TimeConstants.oneMinute,
  };
}
