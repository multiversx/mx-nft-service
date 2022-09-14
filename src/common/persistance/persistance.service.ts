import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AssetLikeEntity, AssetsLikesRepository } from 'src/db/assets';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { TagsRepository } from 'src/db/auctions/tags.repository';
import { CampaignEntity } from 'src/db/campaigns/campaign.entity';
import { CampaignsRepository } from 'src/db/campaigns/campaigns.repository';
import { TierEntity } from 'src/db/campaigns/tiers.entity';
import { TiersRepository } from 'src/db/campaigns/tiers.repository';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { CollectionStatsRepository } from 'src/db/collection-stats/collection-stats.repository';
import { FeaturedNftEntity } from 'src/db/featuredNfts/featured.entity';
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
import { ReportNftEntity, ReportNftsRepository } from 'src/db/reportNft';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { DeleteResult } from 'typeorm';
import { NftTag } from '../services/elrond-communication/models/nft.dto';
import { PersistenceInterface } from './persistance.interface';

@Injectable()
export class PersistenceService implements PersistenceInterface {
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
      'getAssetsLiked',
      this.assetsLikesRepository.getAssetsLiked(limit, offset, address),
    );
  }

  async isAssetLiked(identifier: string, address: string): Promise<boolean> {
    return await this.execute(
      'isAssetLiked',
      this.assetsLikesRepository.isAssetLiked(identifier, address),
    );
  }

  async getAssetLikesCount(identifier: string): Promise<number> {
    return await this.execute(
      'getAssetLikesCount',
      this.assetsLikesRepository.getAssetLikesCount(identifier),
    );
  }

  async getBulkAssetLikesCount(identifiers: string[]): Promise<any> {
    return await this.execute(
      'getBulkAssetLikesCount',
      this.assetsLikesRepository.getBulkAssetLikesCount(identifiers),
    );
  }

  async getIsLikedAsset(identifiers: string[]): Promise<any> {
    return await this.execute(
      'getIsLikedAsset',
      this.assetsLikesRepository.getIsLikedAsset(identifiers),
    );
  }

  async addLike(assetLikeEntity: AssetLikeEntity): Promise<AssetLikeEntity> {
    return await this.execute(
      'addLike',
      this.assetsLikesRepository.addLike(assetLikeEntity),
    );
  }

  async removeLike(identifier: string, address: string): Promise<DeleteResult> {
    return await this.execute(
      'removeLike',
      this.assetsLikesRepository.removeLike(identifier, address),
    );
  }

  async getPublicAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    return await this.execute(
      'getPublicAccountStats',
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
      'getOnwerAccountStats',
      this.accountStatsRepository.getOnwerAccountStats(address, marketplaceKey),
    );
  }

  async getAccountClaimableCount(
    address: string,
    marketplaceKey: string = null,
  ): Promise<number> {
    return await this.execute(
      'getAccountClaimableCount',
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
      'getTagsBySearchTerm',
      this.tagsRepository.getTagsBySearchTerm(searchTerm, page, size),
    );
  }

  async getTags(size: number): Promise<NftTag[]> {
    return await this.execute('getTags', this.tagsRepository.getTags(size));
  }

  async getTagsCount(): Promise<number> {
    return await this.execute(
      'getTagsCount',
      this.tagsRepository.getTagsCount(),
    );
  }

  async getTagsBySearchTermCount(searchTerm: string): Promise<number> {
    return await this.execute(
      'getTagsBySearchTermCount',
      this.tagsRepository.getTagsBySearchTermCount(searchTerm),
    );
  }

  async saveTags(tags: TagEntity[]): Promise<TagEntity[]> {
    return await this.execute('saveTags', this.tagsRepository.saveTags(tags));
  }

  async getStats(identifier: string): Promise<CollectionStatsEntity> {
    return await this.execute(
      'getStats',
      this.collectionStatsRepository.getStats(identifier),
    );
  }

  async getCampaign(
    campaignId: string,
    minterAddress: string,
  ): Promise<CampaignEntity> {
    return await this.execute(
      'getCampaign',
      this.campaignsRepository.getCampaign(campaignId, minterAddress),
    );
  }

  async getCampaignByCollectionTicker(
    collectionTicker: string,
  ): Promise<CampaignEntity> {
    return await this.execute(
      'getCampaignByCollectionTicker',
      this.campaignsRepository.getCampaignByCollectionTicker(collectionTicker),
    );
  }

  async getCampaignByMinterAddress(
    minterAddress: string,
  ): Promise<CampaignEntity[]> {
    return await this.execute(
      'getCampaignByMinterAddress',
      this.campaignsRepository.getCampaignByMinterAddress(minterAddress),
    );
  }

  async getCampaigns(): Promise<[CampaignEntity[], number]> {
    return await this.execute(
      'getCampaigns',
      this.campaignsRepository.getCampaigns(),
    );
  }

  async saveCampaign(campaign: CampaignEntity): Promise<CampaignEntity> {
    return await this.execute(
      'saveCampaign',
      this.campaignsRepository.saveCampaign(campaign),
    );
  }

  async getTier(campaignId: number, tierName: string): Promise<TierEntity> {
    return await this.execute(
      'getTier',
      this.tiersRepository.getTier(campaignId, tierName),
    );
  }

  async getTiersForCampaign(campaignId: number): Promise<TierEntity[]> {
    return await this.execute(
      'getTiersForCampaign',
      this.tiersRepository.getTiersForCampaign(campaignId),
    );
  }

  async saveTier(tier: TierEntity): Promise<TierEntity> {
    return await this.execute('saveTier', this.tiersRepository.saveTier(tier));
  }

  async saveTiers(tiers: TierEntity[]): Promise<TierEntity[]> {
    return await this.execute(
      'saveTiers',
      this.tiersRepository.saveTiers(tiers),
    );
  }

  async getFeaturedCollections(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedNftEntity[], number]> {
    return await this.execute(
      'getFeaturedCollections',
      this.featuredCollectionsRepository.getFeaturedCollections(limit, offset),
    );
  }

  async getFeaturedNfts(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[FeaturedNftEntity[], number]> {
    return await this.execute(
      'getFeaturedNfts',
      this.featuredNftsRepository.getFeaturedNfts(limit, offset),
    );
  }

  async getMarketplaceByAddressAndCollection(
    collection: string,
    address: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      'getMarketplaceByAddressAndCollection',
      this.marketplaceCollectionsRepository.getMarketplaceByAddressAndCollection(
        collection,
        address,
      ),
    );
  }

  async getAllCollections(): Promise<MarketplaceCollectionEntity[]> {
    return await this.execute(
      'getAllCollections',
      this.marketplaceCollectionsRepository.getAllCollections(),
    );
  }

  async getMarketplaceByCollection(
    collection: string,
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      'getMarketplaceByCollection',
      this.marketplaceCollectionsRepository.getMarketplaceByCollection(
        collection,
      ),
    );
  }

  async getMarketplaceByCollections(
    collectionIdentifiers: string[],
  ): Promise<any[]> {
    return await this.execute(
      'getMarketplaceByCollection',
      this.marketplaceCollectionsRepository.getMarketplaceByCollections(
        collectionIdentifiers,
      ),
    );
  }

  async getCollectionsByMarketplace(
    marketplaceKey: string,
  ): Promise<MarketplaceCollectionEntity[]> {
    return await this.execute(
      'getCollectionsByMarketplace',
      this.marketplaceCollectionsRepository.getCollectionsByMarketplace(
        marketplaceKey,
      ),
    );
  }

  async getMarketplaces(): Promise<[MarketplaceEntity[], number]> {
    return await this.execute(
      'getMarketplaces',
      this.marketplaceRepository.getMarketplaces(),
    );
  }

  async getMarketplaceByAddress(address: string): Promise<MarketplaceEntity> {
    return await this.execute(
      'getMarketplaceByAddress',
      this.marketplaceRepository.getMarketplaceByAddress(address),
    );
  }

  async getMarketplacesByKeys(
    marketplaceKeys: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      'getMarketplacesByKeys',
      this.marketplaceRepository.getMarketplacesByKeys(marketplaceKeys),
    );
  }

  async getMarketplacesByAddresses(
    addresses: string[],
  ): Promise<MarketplaceEntity[]> {
    return await this.execute(
      'getMarketplacesByAddresses',
      this.marketplaceRepository.getMarketplacesByAddresses(addresses),
    );
  }

  async isReportedBy(identifier: string, address: string): Promise<boolean> {
    return await this.execute(
      'isReportedBy',
      this.reportNftsRepository.isReportedBy(identifier, address),
    );
  }

  async addReport(reportEntity: ReportNftEntity): Promise<ReportNftEntity> {
    return await this.execute(
      'addReport',
      this.reportNftsRepository.addReport(reportEntity),
    );
  }

  async getReportCount(identifier: string): Promise<number> {
    return await this.execute(
      'getReportCount',
      this.reportNftsRepository.getReportCount(identifier),
    );
  }

  async addFlag(flagEntity: NftFlagsEntity): Promise<NftFlagsEntity> {
    return await this.execute(
      'addFlag',
      this.nftsFlagsRepository.addFlag(flagEntity),
    );
  }

  async batchGetFlags(identifiers: string[]): Promise<Record<string, any>> {
    return await this.execute(
      'batchGetFlags',
      this.nftsFlagsRepository.batchGetFlags(identifiers),
    );
  }

  async upsertFlags(entities: NftFlagsEntity[]): Promise<any> {
    return await this.execute(
      'upsertFlags',
      this.nftsFlagsRepository.upsertFlags(entities),
    );
  }

  async updateFlag(identifier: string, flag: NftFlagsEntity): Promise<any> {
    return await this.execute(
      'updateFlag',
      this.nftsFlagsRepository.update(identifier, flag),
    );
  }

  async saveOrUpdateBulk(nftRarities: NftRarityEntity[]): Promise<void> {
    return await this.execute(
      'saveOrUpdateBulk',
      this.nftRarityRepository.saveOrUpdateBulk(nftRarities),
    );
  }

  async getCollectionIds(): Promise<string[]> {
    return await this.execute(
      'getCollectionIds',
      this.nftRarityRepository.getCollectionIds(),
    );
  }

  async getBulkRarities(identifiers: string[]): Promise<NftRarityEntity[]> {
    return await this.execute(
      'getBulkRarities',
      this.nftRarityRepository.getBulkRarities(identifiers),
    );
  }

  async findNftRarityByCollection(
    collectionTicker: string,
  ): Promise<NftRarityEntity[]> {
    return await this.execute(
      'findNftRarityByCollection',
      this.nftRarityRepository.findNftRarityByCollection(collectionTicker),
    );
  }

  async deleteNftRarity(identifier: string): Promise<any> {
    return await this.execute(
      'deleteNftRarity',
      this.nftRarityRepository.deleteNftRarity(identifier),
    );
  }

  async getNotificationsForAddress(
    address: string,
  ): Promise<[NotificationEntity[], number]> {
    return await this.execute(
      'getNotificationsForAddress',
      this.notificationRepository.getNotificationsForAddress(address),
    );
  }

  async getNotificationsForMarketplace(
    address: string,
    merketplaceKey: string,
  ): Promise<[NotificationEntity[], number]> {
    return await this.execute(
      'getNotificationsForMarketplace',
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
      'getNotificationsByAuctionIds',
      this.notificationRepository.getNotificationsByAuctionIds(auctionIds),
    );
  }

  async getNotificationByIdAndOwner(
    auctionId: number,
    ownerAddress: string,
  ): Promise<NotificationEntity> {
    return await this.execute(
      'getNotificationByIdAndOwner',
      this.notificationRepository.getNotificationByIdAndOwner(
        auctionId,
        ownerAddress,
      ),
    );
  }

  async saveNotification(notification: NotificationEntity) {
    return await this.execute(
      'saveNotification',
      this.notificationRepository.saveNotification(notification),
    );
  }

  async saveNotifications(notifications: NotificationEntity[]) {
    return await this.execute(
      'saveNotifications',
      this.notificationRepository.saveNotifications(notifications),
    );
  }

  async updateNotification(notification: NotificationEntity) {
    return await this.execute(
      'updateNotification',
      this.notificationRepository.updateNotification(notification),
    );
  }
}
