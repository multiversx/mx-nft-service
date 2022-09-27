import { TimeConstants } from 'src/utils/time-utils';

export class CacheInfo {
  key: string = '';
  ttl: number = TimeConstants.oneSecond * 6;

  static AllCollections: CacheInfo = {
    key: 'allCollections',
    ttl: TimeConstants.oneDay,
  };

  static CollectionsMostActive: CacheInfo = {
    key: 'collectionsMostActive',
    ttl: TimeConstants.oneDay,
  };

  static CollectionsMostFollowed: CacheInfo = {
    key: 'collectionsMostFollowed',
    ttl: TimeConstants.oneDay,
  };

  static AllMarketplaces: CacheInfo = {
    key: 'allMarketplaces',
    ttl: TimeConstants.oneHour,
  };

  static AuctionsEndingToday: CacheInfo = {
    key: 'auctionsEndingToday',
    ttl: TimeConstants.oneHour,
  };

  static ActiveAuctions: CacheInfo = {
    key: 'activeAuctions',
    ttl: TimeConstants.oneMinute * 10,
  };

  static TopAuctionsOrderByNoBids: CacheInfo = {
    key: 'auctionsOrderByNoBids',
    ttl: TimeConstants.oneMinute * 10,
  };

  static trendingCollections: CacheInfo = {
    key: 'trendingCollections',
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

  static AuctionTags: CacheInfo = {
    key: 'auctionTags',
    ttl: 5 * TimeConstants.oneMinute,
  };

  static Artist: CacheInfo = {
    key: 'artist',
    ttl: 12 * TimeConstants.oneHour,
  };

  static Account: CacheInfo = {
    key: 'account',
    ttl: TimeConstants.oneMinute,
  };

  static XoxnoScCount: CacheInfo = {
    key: 'xoxno_sc_count',
    ttl: 12 * TimeConstants.oneHour,
  };

  static NftTags: CacheInfo = {
    key: 'nftTags',
    ttl: 5 * TimeConstants.oneMinute,
  };

  static AllTokens: CacheInfo = {
    key: 'allTokens',
    ttl: 30 * TimeConstants.oneMinute,
  };

  static EgldToken: CacheInfo = {
    key: 'egldToken',
    ttl: 10 * TimeConstants.oneMinute,
  };

  static CurrentAuctionsTokens: CacheInfo = {
    key: 'currentAuctionsTokens',
    ttl: 30 * TimeConstants.oneMinute,
  };
}
