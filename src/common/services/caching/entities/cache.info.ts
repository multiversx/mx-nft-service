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

  static FeaturedCollections: CacheInfo = {
    key: 'featuredCollections',
    ttl: TimeConstants.oneWeek,
  };

  static FeaturedNfts: CacheInfo = {
    key: 'featuredNfts',
    ttl: TimeConstants.oneWeek,
  };

  static NftsCount: CacheInfo = {
    key: 'nftsCount',
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

  static BuyNowAuctions: CacheInfo = {
    key: 'buyNowAuctions',
    ttl: TimeConstants.oneMinute * 10,
  };

  static TopAuctionsOrderByNoBids: CacheInfo = {
    key: 'auctionsOrderByNoBids',
    ttl: TimeConstants.oneMinute * 10,
  };

  static TrendingCollections: CacheInfo = {
    key: 'trendingCollections',
    ttl: TimeConstants.oneDay,
  };

  static ActiveCollectionLast30Days: CacheInfo = {
    key: 'activeCollectionLast30Days',
    ttl: TimeConstants.oneDay,
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
    ttl: 5 * TimeConstants.oneHour,
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

  static AllDexTokens: CacheInfo = {
    key: 'allDexTokens',
    ttl: 10 * TimeConstants.oneMinute,
  };

  static AllApiTokens: CacheInfo = {
    key: 'allApiTokens',
    ttl: 10 * TimeConstants.oneMinute,
  };

  static AllTokens: CacheInfo = {
    key: 'allTokens',
    ttl: TimeConstants.oneMinute,
  };

  static EgldToken: CacheInfo = {
    key: 'egldToken',
    ttl: 10 * TimeConstants.oneMinute,
  };

  static TokenHistoricalPrice: CacheInfo = {
    key: 'tokenHistoricalPrice',
    ttl: 30 * TimeConstants.oneDay,
  };

  static CurrentPaymentTokens: CacheInfo = {
    key: 'currentPaymentTokens',
    ttl: 30 * TimeConstants.oneMinute,
  };

  static MostLikedAssets: CacheInfo = {
    key: 'mostLikedAssets',
    ttl: TimeConstants.oneDay,
  };

  static AssetHistory: CacheInfo = {
    key: 'assetHistory',
    ttl: TimeConstants.oneDay,
  };

  static CollectionTypes: CacheInfo = {
    key: 'collectionType',
    ttl: TimeConstants.oneHour,
  };

  static CollectionAssets: CacheInfo = {
    key: 'collectionAssets',
    ttl: TimeConstants.oneDay,
  };

  static CollectionNfts: CacheInfo = {
    key: 'collectionNfts',
    ttl: TimeConstants.oneDay,
  };
}
