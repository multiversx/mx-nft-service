import { Constants } from '@multiversx/sdk-nestjs-common';

export class CacheInfo {
  key: string = '';
  ttl: number = Constants.oneSecond() * 6;

  static AllCollections: CacheInfo = {
    key: 'allCollections',
    ttl: Constants.oneDay(),
  };

  static TrendingByVolume: CacheInfo = {
    key: 'trendingByVolume',
    ttl: Constants.oneWeek(),
  };

  static CollectionsMostActive: CacheInfo = {
    key: 'collectionsMostActive',
    ttl: Constants.oneDay(),
  };

  static FeaturedCollections: CacheInfo = {
    key: 'featuredCollections',
    ttl: Constants.oneWeek(),
  };

  static FeaturedNfts: CacheInfo = {
    key: 'featuredNfts',
    ttl: Constants.oneWeek(),
  };

  static BlacklistedCollections: CacheInfo = {
    key: 'blacklistedCollections',
    ttl: Constants.oneWeek(),
  };

  static NftsCount: CacheInfo = {
    key: 'nftsCount',
    ttl: Constants.oneDay(),
  };

  static CollectionsMostFollowed: CacheInfo = {
    key: 'collectionsMostFollowed',
    ttl: Constants.oneDay(),
  };

  static AllMarketplaces: CacheInfo = {
    key: 'allMarketplaces',
    ttl: Constants.oneHour(),
  };

  static CollectionsByMarketplace: CacheInfo = {
    key: 'collections_by_marketplace',
    ttl: Constants.oneHour(),
  };

  static MarketplaceCollection: CacheInfo = {
    key: 'marketplace_collection',
    ttl: Constants.oneHour(),
  };

  static MarketplaceAddressCollection: CacheInfo = {
    key: 'marketplace_address_collection',
    ttl: Constants.oneHour(),
  };

  static AuctionsEndingToday: CacheInfo = {
    key: 'auctionsEndingToday',
    ttl: Constants.oneHour(),
  };

  static ActiveAuctions: CacheInfo = {
    key: 'activeAuctions',
    ttl: Constants.oneMinute() * 10,
  };

  static BuyNowAuctions: CacheInfo = {
    key: 'buyNowAuctions',
    ttl: Constants.oneMinute() * 10,
  };

  static TopAuctionsOrderByNoBids: CacheInfo = {
    key: 'auctionsOrderByNoBids',
    ttl: Constants.oneMinute() * 10,
  };

  static TrendingCollections: CacheInfo = {
    key: 'trendingCollections',
    ttl: Constants.oneDay(),
  };

  static ActiveCollectionLast30Days: CacheInfo = {
    key: 'activeCollectionLast30Days',
    ttl: Constants.oneDay(),
  };

  static AuctionsEndingInAMonth: CacheInfo = {
    key: 'auctionsEndingInAMonth',
    ttl: Constants.oneHour(),
  };

  static MarketplaceAuctions: CacheInfo = {
    key: 'marketplaceAuctions',
    ttl: Constants.oneHour(),
  };

  static Campaigns: CacheInfo = {
    key: 'allCampaigns',
    ttl: Constants.oneHour(),
  };

  static NrOfNftsOnTransaction: CacheInfo = {
    key: 'NrOfNftsOnTransaction',
    ttl: Constants.oneHour(),
  };

  static AuctionTags: CacheInfo = {
    key: 'auctionTags',
    ttl: 5 * Constants.oneHour(),
  };

  static Artist: CacheInfo = {
    key: 'artist',
    ttl: 12 * Constants.oneHour(),
  };

  static Account: CacheInfo = {
    key: 'account',
    ttl: Constants.oneMinute(),
  };

  static XoxnoScCount: CacheInfo = {
    key: 'xoxno_sc_count',
    ttl: 12 * Constants.oneHour(),
  };

  static NftTags: CacheInfo = {
    key: 'nftTags',
    ttl: 5 * Constants.oneMinute(),
  };

  static AllDexTokens: CacheInfo = {
    key: 'allDexTokens',
    ttl: 10 * Constants.oneMinute(),
  };

  static AllApiTokens: CacheInfo = {
    key: 'allApiTokens',
    ttl: 10 * Constants.oneMinute(),
  };

  static CexTokens: CacheInfo = {
    key: 'cexTokens',
    ttl: 10 * Constants.oneMinute(),
  };

  static xExchangeTokens: CacheInfo = {
    key: 'xExchangeTokens',
    ttl: 10 * Constants.oneMinute(),
  };

  static AllTokens: CacheInfo = {
    key: 'allTokens',
    ttl: Constants.oneMinute(),
  };

  static EgldToken: CacheInfo = {
    key: 'egldToken',
    ttl: 10 * Constants.oneMinute(),
  };

  static TokenHistoricalPrice: CacheInfo = {
    key: 'tokenHistoricalPrice',
    ttl: 30 * Constants.oneDay(),
  };

  static CurrentPaymentTokens: CacheInfo = {
    key: 'currentPaymentTokens',
    ttl: 30 * Constants.oneMinute(),
  };

  static MostLikedAssets: CacheInfo = {
    key: 'mostLikedAssets',
    ttl: Constants.oneDay(),
  };

  static AssetHistory: CacheInfo = {
    key: 'assetHistory',
    ttl: 5 * Constants.oneMinute(),
  };

  static CollectionTypes: CacheInfo = {
    key: 'collectionType',
    ttl: Constants.oneHour(),
  };

  static CollectionAssets: CacheInfo = {
    key: 'collectionAssets',
    ttl: Constants.oneDay(),
  };

  static CollectionAssetsCount: CacheInfo = {
    key: 'collectionAssetsCount',
    ttl: Constants.oneDay(),
  };

  static CollectionStats: CacheInfo = {
    key: 'collection_stats',
    ttl: 5 * Constants.oneMinute(),
  };

  static CollectionNfts: CacheInfo = {
    key: 'collectionNfts',
    ttl: Constants.oneDay(),
  };

  static NftScamInfo: CacheInfo = {
    key: 'nftScamInfo',
    ttl: Constants.oneDay(),
  };

  static NftAnalytic24hCount: CacheInfo = {
    key: 'nftAnalytic24hCount',
    ttl: 10 * Constants.oneMinute(),
  };

  static NftAnalytic24hListing: CacheInfo = {
    key: 'nftAnalytic24hListing',
    ttl: 10 * Constants.oneMinute(),
  };

  static NftTransactionsCount: CacheInfo = {
    key: 'nftTransactionsCount',
    ttl: 10 * Constants.oneMinute(),
  };

  static CollectionFloorPrice: CacheInfo = {
    key: 'collectionFloorPrice',
    ttl: 30 * Constants.oneMinute(),
  };

  static CollectionTopHolders: CacheInfo = {
    key: 'collectionTopHolders',
    ttl: 5 * Constants.oneMinute(),
  };

  static NftAnalyticsCount: CacheInfo = {
    key: 'nftAnalyticsCount',
    ttl: 10 * Constants.oneMinute(),
  };

  static NftsHolders: CacheInfo = {
    key: 'nftsHolders',
    ttl: 10 * Constants.oneMinute(),
  };

  static CollectionDetails: CacheInfo = {
    key: 'collectionDetails',
    ttl: 5 * Constants.oneMinute(),
  };

  static Minters: CacheInfo = {
    key: 'minters',
    ttl: Constants.oneHour(),
  };

  static SearchCollection: CacheInfo = {
    key: 'search_collection',
    ttl: 5 * Constants.oneSecond(),
  };

  static SearchNfts: CacheInfo = {
    key: 'search_nfts',
    ttl: 5 * Constants.oneSecond(),
  };

  static SearchAccount: CacheInfo = {
    key: 'search_account',
    ttl: 5 * Constants.oneSecond(),
  };

  static SearchTag: CacheInfo = {
    key: 'search_tag',
    ttl: 5 * Constants.oneSecond(),
  };

  static AccountStats: CacheInfo = {
    key: 'account_stats',
    ttl: 5 * Constants.oneMinute(),
  };

  static AccountBidding: CacheInfo = {
    key: 'account_bidding',
    ttl: 5 * Constants.oneMinute(),
  };

  static AccountCollected: CacheInfo = {
    key: 'account_collected',
    ttl: 5 * Constants.oneSecond(),
  };

  static AccountClaimableCount: CacheInfo = {
    key: 'account_claimable_count',
    ttl: 5 * Constants.oneSecond(),
  };

  static AccountLikesCount: CacheInfo = {
    key: 'account_likes_count',
    ttl: 5 * Constants.oneSecond(),
  };

  static MarketplaceEvents: CacheInfo = {
    key: 'marketplace_events',
    ttl: 12 * Constants.oneMonth(),
  };
}
