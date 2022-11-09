import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { constants } from 'src/config';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AssetLikeEntity, AssetsLikesRepository } from 'src/db/assets';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionsRepository } from 'src/db/auctions/auctions.repository';
import { AuctionWithStartBid } from 'src/db/auctions/auctionWithBidCount.dto';
import { PriceRange } from 'src/db/auctions/price-range';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { TagsRepository } from 'src/db/auctions/tags.repository';
import { CampaignEntity } from 'src/db/campaigns/campaign.entity';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TierEntity } from 'src/db/campaigns/tiers.entity';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { CollectionStatsRepository } from 'src/db/collection-stats/collection-stats.repository';
import {
  FeaturedCollectionEntity,
  FeaturedNftEntity,
} from 'src/db/featuredNfts/featured.entity';
import {
  FeaturedCollectionsRepository,
  FeaturedNftsRepository,
} from 'src/db/featuredNfts/featured.repository';
import {
  MarketplaceCollectionEntity,
  MarketplaceEntity,
} from 'src/db/marketplaces';
import { MarketplaceCollectionsRepository } from 'src/db/marketplaces/marketplace-collections.repository';
import { MarketplaceRepository } from 'src/db/marketplaces/marketplaces.repository';
import { NftRarityEntity } from 'src/db/nft-rarity/nft-rarity.entity';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import {
  NotificationEntity,
  NotificationsRepository,
} from 'src/db/notifications';
import { OfferEntity, OffersRepository } from 'src/db/offers';
import { OffersFiltersForDb } from 'src/db/offers/offers.filter';
import { OrderEntity, OrdersRepository } from 'src/db/orders';
import { ReportNftEntity, ReportNftsRepository } from 'src/db/reportNft';
import { NftScamInfoRepositoryService } from 'src/document-db/repositories/nft-scam.repository';
import { TraitRepositoryService } from 'src/document-db/repositories/traits.repository';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { NftScamInfoModel } from 'src/modules/nft-scam/models/nft-scam-info.model';
import { CollectionTraitSummary } from 'src/modules/nft-traits/models/collection-traits.model';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { DeleteResult } from 'typeorm';
import { Nft, NftTag } from '../services/elrond-communication/models/nft.dto';

@Injectable()
export class PersistenceService {
  constructor(
    private readonly assetsLikesRepository: AssetsLikesRepository,
    private readonly accountStatsRepository: AccountStatsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly collectionStatsRepository: CollectionStatsRepository,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly tiersRepository: TiersRepository,
    private readonly featuredCollectionsRepository: FeaturedCollectionsRepository,
    private readonly featuredNftsRepository: FeaturedNftsRepository,
    private readonly marketplaceCollectionsRepository: MarketplaceCollectionsRepository,
    private readonly marketplaceRepository: MarketplaceRepository,
    private readonly reportNftsRepository: ReportNftsRepository,
    private readonly nftsFlagsRepository: NftsFlagsRepository,
    private readonly nftRarityRepository: NftRarityRepository,
    private readonly notificationRepository: NotificationsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly auctionsRepository: AuctionsRepository,
    private readonly traitRepositoryService: TraitRepositoryService,
    private readonly nftScamInfoRepositoryService: NftScamInfoRepositoryService,
    private readonly offersRepository: OffersRepository,
  ) {}

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      return await action;
    } finally {
      profiler.stop();

      MetricsCollector.setPersistenceDuration(key, profiler.duration);
    }
  }

  async getAssetsLiked(
    limit: number = 20,
    offset: number = 0,
    address: string,
  ): Promise<[AssetLikeEntity[], number]> {
    return await this.execute(
      this.getAssetsLiked.name,
      this.assetsLikesRepository.getAssetsLiked(limit, offset, address),
    );
  }

  async isAssetLiked(identifier: string, address: string): Promise<boolean> {
    return await this.execute(
      this.isAssetLiked.name,
      this.assetsLikesRepository.isAssetLiked(identifier, address),
    );
  }

  async getAssetLikesCount(identifier: string): Promise<number> {
    return await this.execute(
      this.getAssetLikesCount.name,
      this.assetsLikesRepository.getAssetLikesCount(identifier),
    );
  }

  async getLikesCountForAddress(address: string): Promise<number> {
    return await this.execute(
      this.getLikesCountForAddress.name,
      this.assetsLikesRepository.getLikesCountForAddress(address),
    );
  }

  async getBulkAssetLikesCount(identifiers: string[]): Promise<any> {
    return await this.execute(
      this.getBulkAssetLikesCount.name,
      this.assetsLikesRepository.getBulkAssetLikesCount(identifiers),
    );
  }

  async getIsLikedAsset(identifiers: string[]): Promise<any> {
    return await this.execute(
      this.getIsLikedAsset.name,
      this.assetsLikesRepository.getIsLikedAsset(identifiers),
    );
  }

  async addLike(assetLikeEntity: AssetLikeEntity): Promise<AssetLikeEntity> {
    return await this.execute(
      this.addLike.name,
      this.assetsLikesRepository.addLike(assetLikeEntity),
    );
  }

  async removeLike(identifier: string, address: string): Promise<DeleteResult> {
    return await this.execute(
      this.removeLike.name,
      this.assetsLikesRepository.removeLike(identifier, address),
    );
  }

  async getPublicAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    return await this.execute(
      this.getPublicAccountStats.name,
      this.accountStatsRepository.getPublicAccountStats(
        address,
        marketplaceKey,
      ),
    );
  }

  async getOnwerAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    return await this.execute(
      this.getOnwerAccountStats.name,
      this.accountStatsRepository.getOnwerAccountStats(address, marketplaceKey),
    );
  }

  async getAccountClaimableCount(
    address: string,
    marketplaceKey: string = null,
  ): Promise<number> {
    return await this.execute(
      this.getAccountClaimableCount.name,
      this.accountStatsRepository.getAccountClaimableCount(
        address,
        marketplaceKey,
      ),
    );
  }

  async getTagsBySearchTerm(
    searchTerm: string,
    page: number = 0,
    size: number = 10,
  ): Promise<NftTag[]> {
    return await this.execute(
      this.getTagsBySearchTerm.name,
      this.tagsRepository.getTagsBySearchTerm(searchTerm, page, size),
    );
  }

  async getTags(size: number): Promise<NftTag[]> {
    return await this.execute(
      this.getTags.name,
      this.tagsRepository.getTags(size),
    );
  }

  async getTagsCount(): Promise<number> {
    return await this.execute(
      this.getTagsCount.name,
      this.tagsRepository.getTagsCount(),
    );
  }

  async getTagsBySearchTermCount(searchTerm: string): Promise<number> {
    return await this.execute(
      this.getTagsBySearchTermCount.name,
      this.tagsRepository.getTagsBySearchTermCount(searchTerm),
    );
  }

  async saveTags(tags: TagEntity[]): Promise<TagEntity[]> {
    return await this.execute(
      this.saveTags.name,
      this.tagsRepository.saveTags(tags),
    );
  }

  async getCollectionStats(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = 'EGLD',
  ): Promise<CollectionStatsEntity> {
    return await this.execute(
      this.getCollectionStats.name,
      this.collectionStatsRepository.getStats(
        identifier,
        marketplaceKey,
        paymentToken,
      ),
    );
  }

  async getCampaign(
    campaignId: string,
    minterAddress: string,
  ): Promise<CampaignEntity> {
    return await this.execute(
      this.getCampaign.name,
      this.campaignsRepository.getCampaign(campaignId, minterAddress),
    );
  }

  async getCampaignByCollectionTicker(
    collectionTicker: string,
  ): Promise<CampaignEntity> {
    return await this.execute(
      this.getCampaignByCollectionTicker.name,
      this.campaignsRepository.getCampaignByCollectionTicker(collectionTicker),
    );
  }

  async getCampaignByMinterAddress(
    minterAddress: string,
  ): Promise<CampaignEntity[]> {
    return await this.execute(
      this.getCampaignByMinterAddress.name,
      this.campaignsRepository.getCampaignByMinterAddress(minterAddress),
    );
  }

  async getCampaigns(): Promise<[CampaignEntity[], number]> {
    return await this.execute(
      this.getCampaigns.name,
      this.campaignsRepository.getCampaigns(),
    );
  }

  async saveCampaign(campaign: CampaignEntity): Promise<CampaignEntity> {
    return await this.execute(
      this.saveCampaign.name,
      this.campaignsRepository.saveCampaign(campaign),
    );
  }

  async getTier(campaignId: number, tierName: string): Promise<TierEntity> {
    return await this.execute(
      this.getTier.name,
      this.tiersRepository.getTier(campaignId, tierName),
    );
  }

  async getTiersForCampaign(campaignId: number): Promise<TierEntity[]> {
    return await this.execute(
      this.getTiersForCampaign.name,
      this.tiersRepository.getTiersForCampaign(campaignId),
    );
  }

  async saveTier(tier: TierEntity): Promise<TierEntity> {
    return await this.execute(
      this.saveTier.name,
      this.tiersRepository.saveTier(tier),
    );
  }

  async saveTiers(tiers: TierEntity[]): Promise<TierEntity[]> {
    return await this.execute(
      this.saveTiers.name,
      this.tiersRepository.saveTiers(tiers),
    );
  }

  async getFeaturedCollections(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedCollectionEntity[], number]> {
    return await this.execute(
      this.getFeaturedCollections.name,
      this.featuredCollectionsRepository.getFeaturedCollections(limit, offset),
    );
  }

  async getFeaturedNfts(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedNftEntity[], number]> {
    return await this.execute(
      this.getFeaturedNfts.name,
      this.featuredNftsRepository.getFeaturedNfts(limit, offset),
    );
  }

  async getMarketplaceByAddressAndCollection(
    collection: string,
    address: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      this.getMarketplaceByAddressAndCollection.name,
      this.marketplaceCollectionsRepository.getMarketplaceByAddressAndCollection(
        collection,
        address,
      ),
    );
  }

  async getAllCollections(): Promise<MarketplaceCollectionEntity[]> {
    return await this.execute(
      this.getAllCollections.name,
      this.marketplaceCollectionsRepository.getAllCollections(),
    );
  }

  async getMarketplaceByCollection(
    collection: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      this.getMarketplaceByCollection.name,
      this.marketplaceCollectionsRepository.getMarketplaceByCollection(
        collection,
      ),
    );
  }

  async getMarketplaceByCollections(
    collectionIdentifiers: string[],
  ): Promise<any[]> {
    return await this.execute(
      this.getMarketplaceByCollection.name,
      this.marketplaceCollectionsRepository.getMarketplaceByCollections(
        collectionIdentifiers,
      ),
    );
  }

  async getCollectionsByMarketplace(
    marketplaceKey: string,
  ): Promise<MarketplaceCollectionEntity[]> {
    return await this.execute(
      this.getCollectionsByMarketplace.name,
      this.marketplaceCollectionsRepository.getCollectionsByMarketplace(
        marketplaceKey,
      ),
    );
  }

  async getMarketplaces(): Promise<[MarketplaceEntity[], number]> {
    return await this.execute(
      this.getMarketplaces.name,
      this.marketplaceRepository.getMarketplaces(),
    );
  }

  async getMarketplaceByAddress(address: string): Promise<MarketplaceEntity> {
    return await this.execute(
      this.getMarketplaceByAddress.name,
      this.marketplaceRepository.getMarketplaceByAddress(address),
    );
  }

  async getMarketplacesByKeys(
    marketplaceKeys: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      this.getMarketplacesByKeys.name,
      this.marketplaceRepository.getMarketplacesByKeys(marketplaceKeys),
    );
  }

  async getMarketplacesByAddresses(
    addresses: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      this.getMarketplacesByAddresses.name,
      this.marketplaceRepository.getMarketplacesByAddresses(addresses),
    );
  }

  async isReportedBy(identifier: string, address: string): Promise<boolean> {
    return await this.execute(
      this.isReportedBy.name,
      this.reportNftsRepository.isReportedBy(identifier, address),
    );
  }

  async addReport(reportEntity: ReportNftEntity): Promise<ReportNftEntity> {
    return await this.execute(
      this.addReport.name,
      this.reportNftsRepository.addReport(reportEntity),
    );
  }

  async getReportCount(identifier: string): Promise<number> {
    return await this.execute(
      this.getReportCount.name,
      this.reportNftsRepository.getReportCount(identifier),
    );
  }

  async addFlag(flagEntity: NftFlagsEntity): Promise<NftFlagsEntity> {
    return await this.execute(
      this.addFlag.name,
      this.nftsFlagsRepository.addFlag(flagEntity),
    );
  }

  async batchGetFlags(identifiers: string[]): Promise<Record<string, any>> {
    return await this.execute(
      this.batchGetFlags.name,
      this.nftsFlagsRepository.batchGetFlags(identifiers),
    );
  }

  async upsertFlags(entities: NftFlagsEntity[]): Promise<any> {
    return await this.execute(
      this.upsertFlags.name,
      this.nftsFlagsRepository.upsertFlags(entities),
    );
  }

  async updateFlag(flag: NftFlagsEntity): Promise<any> {
    return await this.execute(
      this.updateFlag.name,
      this.nftsFlagsRepository.updateFlag(flag),
    );
  }

  async saveOrUpdateBulkRarities(
    nftRarities: NftRarityEntity[],
  ): Promise<void> {
    return await this.execute(
      this.saveOrUpdateBulkRarities.name,
      this.nftRarityRepository.saveOrUpdateBulk(nftRarities),
    );
  }

  async getCollectionIds(): Promise<string[]> {
    return await this.execute(
      this.getCollectionIds.name,
      this.nftRarityRepository.getCollectionIds(),
    );
  }

  async getBulkRarities(identifiers: string[]): Promise<NftRarityEntity[]> {
    return await this.execute(
      this.getBulkRarities.name,
      this.nftRarityRepository.getBulkRarities(identifiers),
    );
  }

  async findNftRarityByCollection(
    collectionTicker: string,
  ): Promise<NftRarityEntity[]> {
    return await this.execute(
      this.findNftRarityByCollection.name,
      this.nftRarityRepository.findNftRarityByCollection(collectionTicker),
    );
  }

  async deleteNftRarity(identifier: string): Promise<any> {
    return await this.execute(
      this.deleteNftRarity.name,
      this.nftRarityRepository.deleteNftRarity(identifier),
    );
  }

  async getNotificationsForAddress(
    address: string,
  ): Promise<[NotificationEntity[], number]> {
    return await this.execute(
      this.getNotificationsForAddress.name,
      this.notificationRepository.getNotificationsForAddress(address),
    );
  }

  async getNotificationsForMarketplace(
    address: string,
    merketplaceKey: string,
  ): Promise<[NotificationEntity[], number]> {
    return await this.execute(
      this.getNotificationsForMarketplace.name,
      this.notificationRepository.getNotificationsForMarketplace(
        address,
        merketplaceKey,
      ),
    );
  }

  async getNotificationsByAuctionIds(
    auctionIds: number[],
  ): Promise<NotificationEntity[]> {
    return await this.execute(
      this.getNotificationsByAuctionIds.name,
      this.notificationRepository.getNotificationsByAuctionIds(auctionIds),
    );
  }

  async getNotificationByIdAndOwner(
    auctionId: number,
    ownerAddress: string,
  ): Promise<NotificationEntity> {
    return await this.execute(
      this.getNotificationByIdAndOwner.name,
      this.notificationRepository.getNotificationByIdAndOwner(
        auctionId,
        ownerAddress,
      ),
    );
  }

  async saveNotification(notification: NotificationEntity) {
    return await this.execute(
      this.saveNotification.name,
      this.notificationRepository.saveNotification(notification),
    );
  }

  async saveNotifications(notifications: NotificationEntity[]) {
    return await this.execute(
      this.saveNotifications.name,
      this.notificationRepository.saveNotifications(notifications),
    );
  }

  async updateNotification(notification: NotificationEntity) {
    return await this.execute(
      this.updateNotification.name,
      this.notificationRepository.updateNotification(notification),
    );
  }

  async getActiveOrderForAuction(auctionId: number): Promise<OrderEntity> {
    return await this.execute(
      this.getActiveOrderForAuction.name,
      this.ordersRepository.getActiveOrderForAuction(auctionId),
    );
  }

  async getActiveOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return await this.execute(
      this.getActiveOrdersForAuction.name,
      this.ordersRepository.getActiveOrdersForAuction(auctionId),
    );
  }

  async getOrdersByAuctionIdsOrderByPrice(
    auctionIds: number[],
  ): Promise<OrderEntity[]> {
    return await this.execute(
      this.getOrdersByAuctionIdsOrderByPrice.name,
      this.ordersRepository.getOrdersByAuctionIdsOrderByPrice(auctionIds),
    );
  }

  async getOrdersByComposedKeys(auctionIds: string[]): Promise<any[]> {
    return await this.execute(
      this.getOrdersByComposedKeys.name,
      this.ordersRepository.getOrdersByComposedKeys(auctionIds),
    );
  }

  async getLastOrdersByAuctionIds(auctionIds: number[]): Promise<any[]> {
    return await this.execute(
      this.getLastOrdersByAuctionIds.name,
      this.ordersRepository.getLastOrdersByAuctionIds(auctionIds),
    );
  }

  async getOrdersByAuctionIds(auctionIds: number[]): Promise<any[]> {
    return await this.execute(
      this.getOrdersByAuctionIds.name,
      this.ordersRepository.getOrdersByAuctionIds(auctionIds),
    );
  }

  async getOrders(
    queryRequest: QueryRequest,
  ): Promise<[OrderEntity[], number]> {
    return await this.execute(
      this.getOrders.name,
      this.ordersRepository.getOrders(queryRequest),
    );
  }

  async saveOrder(order: OrderEntity) {
    return await this.execute(
      this.saveOrder.name,
      this.ordersRepository.saveOrder(order),
    );
  }

  async updateOrderWithStatus(order: OrderEntity, status: OrderStatusEnum) {
    return await this.execute(
      this.updateOrderWithStatus.name,
      this.ordersRepository.updateOrderWithStatus(order, status),
    );
  }

  async rollbackOrdersByHash(blockHash: string) {
    return await this.execute(
      this.rollbackOrdersByHash.name,
      this.ordersRepository.rollbackOrdersByHash(blockHash),
    );
  }

  async deleteOrdersByAuctionId(auctionIds: number[]) {
    return await this.execute(
      this.deleteOrdersByAuctionId.name,
      this.ordersRepository.deleteOrdersByAuctionId(auctionIds),
    );
  }

  async getAuctions(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    return await this.execute(
      this.getAuctions.name,
      this.auctionsRepository.getAuctions(queryRequest),
    );
  }

  async getAuctionsGroupBy(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[] | AuctionWithStartBid[], number, PriceRange]> {
    return await this.execute(
      this.getAuctionsGroupBy.name,
      this.auctionsRepository.getAuctionsGroupBy(queryRequest),
    );
  }

  async getAuctionsForIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    return await this.execute(
      this.getAuctionsForIdentifier.name,
      this.auctionsRepository.getAuctionsForIdentifier(queryRequest),
    );
  }

  async getAuctionsForHash(blockHash: string): Promise<AuctionEntity[]> {
    return await this.execute(
      this.getAuctionsForHash.name,
      this.auctionsRepository.getAuctionsForHash(blockHash),
    );
  }

  async getClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
  ): Promise<[AuctionEntity[], number]> {
    return await this.execute(
      this.getClaimableAuctions.name,
      this.auctionsRepository.getClaimableAuctions(limit, offset, address),
    );
  }

  async getClaimableAuctionsForMarketplaceKey(
    limit: number = 10,
    offset: number = 0,
    address: string,
    marketplaceKey: string,
  ): Promise<[AuctionEntity[], number]> {
    return await this.execute(
      this.getClaimableAuctions.name,
      this.auctionsRepository.getClaimableAuctionsForMarketplaceKey(
        limit,
        offset,
        address,
        marketplaceKey,
      ),
    );
  }

  async getAuctionsOrderByOrdersCountGroupByIdentifier(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    return await this.execute(
      this.getAuctionsOrderByOrdersCountGroupByIdentifier.name,
      this.auctionsRepository.getAuctionsOrderByOrdersCountGroupByIdentifier(
        queryRequest,
      ),
    );
  }

  async getTrendingCollections(): Promise<any[]> {
    return await this.execute(
      this.getTrendingCollections.name,
      this.auctionsRepository.getTrendingCollections(),
    );
  }

  async getTrendingCollectionsCount(): Promise<number> {
    return await this.execute(
      this.getTrendingCollectionsCount.name,
      this.auctionsRepository.getTrendingCollectionsCount(),
    );
  }

  async getActiveCollectionsLast30Days(): Promise<any[]> {
    return await this.execute(
      this.getActiveCollectionsLast30Days.name,
      this.auctionsRepository.getActiveCollectionsFromLast30Days(),
    );
  }

  async getActiveCollectionsLast30DaysCount(): Promise<number> {
    return await this.execute(
      this.getActiveCollectionsLast30DaysCount.name,
      this.auctionsRepository.getCollectionsActiveFromLast30DaysCount(),
    );
  }

  async getAuctionsOrderByOrdersCount(
    queryRequest: QueryRequest,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    return await this.execute(
      this.getAuctionsOrderByOrdersCount.name,
      this.auctionsRepository.getAuctionsOrderByOrdersCount(queryRequest),
    );
  }

  async getMinMax(token: string): Promise<PriceRange> {
    return await this.execute(
      this.getMinMax.name,
      this.auctionsRepository.getMinMax(token),
    );
  }

  async getAuction(id: number): Promise<AuctionEntity> {
    return await this.execute(
      this.getAuction.name,
      this.auctionsRepository.getAuction(id),
    );
  }

  async getBulkAuctions(auctionsIds: number[]): Promise<AuctionEntity[]> {
    return await this.execute(
      this.getBulkAuctions.name,
      this.auctionsRepository.getBulkAuctions(auctionsIds),
    );
  }

  async getAuctionByMarketplace(
    id: number,
    marketplaceKey: string,
  ): Promise<AuctionEntity> {
    return await this.execute(
      this.getAuctionByMarketplace.name,
      this.auctionsRepository.getAuctionByMarketplace(id, marketplaceKey),
    );
  }

  async getAuctionByIdentifierAndMarketplace(
    identifier: string,
    marketplaceKey: string,
  ): Promise<AuctionEntity> {
    return await this.execute(
      this.getAuctionByIdentifierAndMarketplace.name,
      this.auctionsRepository.getAuctionByIdentifierAndMarketplace(
        identifier,
        marketplaceKey,
      ),
    );
  }

  async getAuctionCountForIdentifiers(
    identifiers: string[],
  ): Promise<AuctionEntity[]> {
    return await this.execute(
      this.getAuctionCountForIdentifiers.name,
      this.auctionsRepository.getAuctionCountForIdentifiers(identifiers),
    );
  }

  async getAuctionsForIdentifiers(identifiers: string[]): Promise<any[]> {
    return await this.execute(
      this.getAuctionsForIdentifiers.name,
      this.auctionsRepository.getAuctionsForIdentifiers(identifiers),
    );
  }

  async getAvailableTokensForIdentifiers(identifiers: string[]): Promise<any> {
    return await this.execute(
      this.getAvailableTokensForIdentifiers.name,
      this.auctionsRepository.getAvailableTokensForIdentifiers(identifiers),
    );
  }

  async getAvailableTokensForAuctionIds(auctionIds: number[]): Promise<any> {
    return await this.execute(
      this.getAvailableTokensForAuctionIds.name,
      this.auctionsRepository.getAvailableTokensForAuctionIds(auctionIds),
    );
  }

  async getLowestAuctionForIdentifiers(identifiers: string[]): Promise<any> {
    return await this.execute(
      this.getLowestAuctionForIdentifiers.name,
      this.auctionsRepository.getLowestAuctionForIdentifiers(identifiers),
    );
  }

  async getLowestAuctionForIdentifiersAndMarketplace(
    identifiers: string[],
  ): Promise<any> {
    return await this.execute(
      this.getLowestAuctionForIdentifiersAndMarketplace.name,
      this.auctionsRepository.getLowestAuctionForIdentifiersAndMarketplace(
        identifiers,
      ),
    );
  }

  async getAvailableTokensByAuctionId(id: number): Promise<any> {
    return await this.execute(
      this.getAvailableTokensByAuctionId.name,
      this.auctionsRepository.getAvailableTokensByAuctionId(id),
    );
  }

  async getOnSaleAssetCountForCollections(identifiers: string[]): Promise<any> {
    return await this.execute(
      this.getOnSaleAssetCountForCollections.name,
      this.auctionsRepository.getOnSaleAssetCountForCollections(identifiers),
    );
  }

  async getAuctionsThatReachedDeadline(): Promise<AuctionEntity[]> {
    return await this.execute(
      this.getAuctionsThatReachedDeadline.name,
      this.auctionsRepository.getAuctionsThatReachedDeadline(),
    );
  }

  async insertAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    return await this.execute(
      this.insertAuction.name,
      this.auctionsRepository.insertAuction(auction),
    );
  }

  async rollbackAuctionAndOrdersByHash(blockHash: string): Promise<any> {
    return await this.execute(
      this.rollbackAuctionAndOrdersByHash.name,
      this.auctionsRepository.rollbackAuctionAndOrdersByHash(blockHash),
    );
  }

  async updateAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    return await this.execute(
      this.updateAuction.name,
      this.auctionsRepository.updateAuction(auction),
    );
  }

  async updateAuctionStatus(
    auctionId: number,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<AuctionEntity> {
    return await this.execute(
      this.updateAuctionStatus.name,
      this.auctionsRepository.updateAuctionStatus(auctionId, status, hash),
    );
  }

  async updateAuctionByMarketplace(
    auctionId: number,
    marketplaceKey: string,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<AuctionEntity> {
    return await this.execute(
      this.updateAuctionByMarketplace.name,
      this.auctionsRepository.updateAuctionByMarketplace(
        auctionId,
        marketplaceKey,
        status,
        hash,
      ),
    );
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<any> {
    return await this.execute(
      this.updateAuctions.name,
      this.auctionsRepository.updateAuctions(auctions),
    );
  }

  async getCurrentPaymentTokenIdsWithCounts(
    marketplaceKey?: string,
    collectionIdentifier?: string,
  ): Promise<{ paymentToken: string; activeAuctions: number }[]> {
    return await this.execute(
      this.getCurrentPaymentTokenIdsWithCounts.name,
      this.auctionsRepository.getCurrentPaymentTokenIds(
        marketplaceKey,
        collectionIdentifier,
      ),
    );
  }

  async getOfferById(id: number): Promise<OfferEntity> {
    return await this.execute(
      this.getOfferById.name,
      this.offersRepository.getOfferById(id),
    );
  }

  async getOffers(
    filters?: OffersFiltersForDb,
    offset: number = 0,
    limit: number = 10,
  ): Promise<[OfferEntity[], number]> {
    return await this.execute(
      this.getOffers.name,
      this.offersRepository.getActiveOffers(filters, offset, limit),
    );
  }

  async getOfferByIdAndMarketplace(
    marketplaceOfferId: number,
    marletplaceKey: string,
  ): Promise<OfferEntity> {
    return await this.execute(
      this.getOfferByIdAndMarketplace.name,
      this.offersRepository.getOfferByIdAndMarketplaceKey(
        marketplaceOfferId,
        marletplaceKey,
      ),
    );
  }

  async saveOffer(offer: OfferEntity): Promise<OfferEntity> {
    return await this.execute(
      this.saveOffer.name,
      this.offersRepository.saveOffer(offer),
    );
  }

  async getMostLikedAssetsIdentifiers(
    offset?: number,
    limit?: number,
  ): Promise<AssetLikeEntity[]> {
    return await this.execute(
      this.getMostLikedAssetsIdentifiers.name,
      this.assetsLikesRepository.getMostLikedAssetsIdentifiers(offset, limit),
    );
  }

  async getTraitSummary(collection: string): Promise<CollectionTraitSummary> {
    return await this.traitRepositoryService.findOne({
      identifier: collection,
    });
  }

  async saveOrUpdateTraitSummary(
    traitSummary: CollectionTraitSummary,
  ): Promise<void> {
    traitSummary = traitSummary.updateTimestamp();
    const res = await this.traitRepositoryService.findOneAndUpdate(
      {
        identifier: traitSummary.identifier,
      },
      traitSummary,
    );
    if (!res) {
      await this.traitRepositoryService.create(traitSummary);
    }
  }

  async updateTraitSummaryLastUpdated(collection: string): Promise<void> {
    const res = await this.traitRepositoryService.findOneAndUpdate(
      { identifier: collection },
      { lastUpdated: new Date().getTime() },
    );
    if (!res) {
      await this.traitRepositoryService.create(
        new CollectionTraitSummary({
          identifier: collection,
          lastUpdated: new Date().getTime(),
        }),
      );
    }
  }

  async saveOrUpdateNftScamInfo(
    identifier: string,
    version: string,
    scamInfo?: ScamInfo,
  ): Promise<void> {
    let doc: NftScamInfoModel = { identifier: identifier, version: version };
    if (scamInfo) {
      doc = { ...doc, type: scamInfo.type, info: scamInfo.info };
    }
    const res = await this.nftScamInfoRepositoryService.findOneAndReplace(
      {
        identifier: identifier,
      },
      doc,
    );
    if (!res) {
      await this.nftScamInfoRepositoryService.create(doc);
    }
  }

  async saveOrUpdateBulkNftScamInfo(
    nfts: Nft[],
    version: string,
  ): Promise<void> {
    if (!nfts || nfts.length === 0) {
      return;
    }
    await this.nftScamInfoRepositoryService.saveOrUpdateBulk(nfts, version);
  }

  async deleteNftScamInfo(identifier: string): Promise<void> {
    await this.nftScamInfoRepositoryService.findOneAndDelete({
      identifier: identifier,
    });
  }

  async getBulkNftScamInfo(identifiers: string[]): Promise<NftScamInfoModel[]> {
    return await this.nftScamInfoRepositoryService.getManyByIdentifiers(
      identifiers,
    );
  }

  async getNftScamInfo(
    identifier: string,
  ): Promise<NftScamInfoModel | undefined> {
    return await this.nftScamInfoRepositoryService.findOne({
      identifier: identifier,
    });
  }
}
