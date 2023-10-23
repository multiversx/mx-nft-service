import { CpuProfiler } from '@multiversx/sdk-nestjs-monitoring';
import { Injectable, Logger } from '@nestjs/common';
import { AssetsRedisHandler } from 'src/modules/assets';
import { AssetsCollectionsForOwnerRedisHandler } from 'src/modules/assets/loaders/assets-collection-for-owner.redis-handler';
import { AssetsCollectionsRedisHandler } from 'src/modules/assets/loaders/assets-collection.redis-handler';
import { AssetScamInfoRedisHandler } from 'src/modules/assets/loaders/assets-scam-info.redis-handler';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { rabbitExchanges, rabbitQueues } from './../rabbit-config';
import { PublicRabbitConsumer } from './../rabbitmq.consumers';
import { CacheInvalidationAdminService } from './cache-admin-module/cache-admin-invalidation.service';
import { CacheSetterAdminService } from './cache-admin-module/cache-admin-setter.service';
import { CacheInvalidationEventsService } from './cache-invalidation-module/cache-invalidation-events.service';
import { CacheEventTypeEnum, ChangedEvent } from './events/changed.event';
import { MintersCachingService } from 'src/modules/minters/minters-caching.service';
import { MarketplacesCachingService } from 'src/modules/marketplaces/marketplaces-caching.service';
import { CampaignsCachingService } from 'src/modules/campaigns/campaigns-caching.service';
import { MarketplaceRedisHandler } from 'src/modules/marketplaces/loaders/marketplace.redis-handler';
import { AssetsSupplyRedisHandler } from 'src/modules/assets/loaders/assets-supply.redis-handler';

@Injectable()
export class CacheEventsConsumer {
  constructor(
    private cacheSetterAdminService: CacheSetterAdminService,
    private cacheInvalidationAdminService: CacheInvalidationAdminService,
    private assetsRedisHandler: AssetsRedisHandler,
    private assetsSuplyRedisHandler: AssetsSupplyRedisHandler,
    private collectionAssetsCount: CollectionAssetsCountRedisHandler,
    private collectionAssets: CollectionAssetsRedisHandler,
    private assetScamInfoRedisHandler: AssetScamInfoRedisHandler,
    private cacheInvalidationEventsService: CacheInvalidationEventsService,
    private collectionAssetsRedisHandler: AssetsCollectionsRedisHandler,
    private collectionAssetsForOwnerRedisHandler: AssetsCollectionsForOwnerRedisHandler,
    private cacheMintersService: MintersCachingService,
    private cacheMarketplacesService: MarketplacesCachingService,
    private marketplaceRedisHandler: MarketplaceRedisHandler,
    private cacheCampaignsService: CampaignsCachingService,
    private logger: Logger,
  ) {}

  @PublicRabbitConsumer({
    connection: 'common',
    exchange: rabbitExchanges.CACHE_INVALIDATION,
    queueName: `${rabbitQueues.CACHE_INVALIDATION}-${process.env.CLUSTER ?? 'development'}`,
    disable: !(process.env.ENABLE_CACHE_INVALIDATION === 'true'),
  })
  async consume(event: ChangedEvent): Promise<void> {
    this.logger.log({ event });
    switch (event.type) {
      case CacheEventTypeEnum.OwnerChanged:
        const profiler = new CpuProfiler();
        const collectionIdentifier = event.id.split('-').slice(0, 2).join('-');
        await Promise.all([
          this.assetsRedisHandler.clearKey(event.id),
          this.collectionAssetsRedisHandler.clearKey(collectionIdentifier),
          this.collectionAssetsForOwnerRedisHandler.clearKey(`${collectionIdentifier}_${event.address}`),
          this.collectionAssetsForOwnerRedisHandler.clearKey(`${collectionIdentifier}_${event.extraInfo?.receiverAddress}`),
        ]);
        profiler.stop('OwnerChanged');

        break;

      case CacheEventTypeEnum.AssetsRefresh:
        const profilerAssets = new CpuProfiler();
        const collections = event.id.map((identifier) => {
          const { collection } = getCollectionAndNonceFromIdentifier(identifier);
          return collection;
        });
        await Promise.all([
          this.assetsRedisHandler.clearMultipleKeys(event.id),
          this.assetScamInfoRedisHandler.clearMultipleKeys(event.id),
          this.collectionAssets.clearMultipleKeys(collections),
        ]);
        profilerAssets.stop('AssetsRefresh');
        break;

      case CacheEventTypeEnum.AssetRefresh:
        const profilerAssetRefresh = new CpuProfiler();
        const { collection } = getCollectionAndNonceFromIdentifier(event.id);
        const collectionsAssetForOnwerPromise = event.address
          ? this.collectionAssetsForOwnerRedisHandler.clearKey(`${collection}_${event.address}`)
          : this.collectionAssetsForOwnerRedisHandler.clearKeyByPattern(collection);
        await Promise.all([
          this.assetsRedisHandler.clearKey(event.id),
          this.assetsSuplyRedisHandler.clearKey(event.id),
          this.collectionAssets.clearKey(collection),
          this.collectionAssetsRedisHandler.clearKey(collection),
          collectionsAssetForOnwerPromise,
        ]);
        profilerAssetRefresh.stop('AssetRefresh');
        break;

      case CacheEventTypeEnum.MarkCollection:
        const profilerMarkCollection = new CpuProfiler();
        await Promise.all([
          this.assetsRedisHandler.clearKeyByPattern(`${event.id}-`),
          this.assetScamInfoRedisHandler.clearKeyByPattern(`${event.id}-`),
          this.collectionAssets.clearKey(event.id),
        ]);
        profilerMarkCollection.stop('MarkCollection');
        break;

      case CacheEventTypeEnum.Mint:
        const profilerMint = new CpuProfiler();
        await this.collectionAssets.clearKey(event.id);
        await this.collectionAssetsCount.clearKey(event.id);
        profilerMint.stop('Mint');
        break;

      case CacheEventTypeEnum.UpdateAuction:
        const profilerUpdateAuction = new CpuProfiler();
        await Promise.all([this.cacheInvalidationEventsService.invalidateAuction(event)]);
        profilerUpdateAuction.stop('UpdateAuction');
        break;

      case CacheEventTypeEnum.UpdateOrder:
        const profilerUpdateOrder = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateOrder(event);
        profilerUpdateOrder.stop('UpdateOrder');
        break;

      case CacheEventTypeEnum.UpdateNotifications:
        const profilerUpdateNotifications = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateNotifications(event);
        profilerUpdateNotifications.stop('UpdateNotifications');
        break;

      case CacheEventTypeEnum.UpdateOneNotification:
        const profilerUpdateOneNotification = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateOneNotification(event);
        profilerUpdateOneNotification.stop('UpdateOneNotification');
        break;

      case CacheEventTypeEnum.AssetLike:
        const profilerAssetLike = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateAssetLike(event);
        profilerAssetLike.stop('AssetLike');
        break;

      case CacheEventTypeEnum.FeaturedCollections: {
        const profilerFeaturedCollections = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateFeaturedCollectionsCache();
        profilerFeaturedCollections.stop('FeaturedCollections');
        break;
      }

      case CacheEventTypeEnum.BlacklistedCollections: {
        const profilerBlacklistedCollections = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateBlacklistedCollectionsCache();
        profilerBlacklistedCollections.stop('BlacklistedCollections');
        break;
      }

      case CacheEventTypeEnum.DeleteCacheKeys: {
        const profilerDeleteCacheKeys = new CpuProfiler();
        await this.cacheInvalidationAdminService.deleteCacheKeys(event);
        profilerDeleteCacheKeys.stop('DeleteCacheKeys');
        break;
      }

      case CacheEventTypeEnum.SetCacheKey: {
        const profilerSetCacheKey = new CpuProfiler();
        await this.cacheSetterAdminService.setCacheKey(event);
        profilerSetCacheKey.stop('SetCacheKey');
        break;
      }
      case CacheEventTypeEnum.UpdateOffer:
        const profilerUpdateOffer = new CpuProfiler();
        await this.cacheInvalidationEventsService.invalidateOffers(event);
        profilerUpdateOffer.stop('UpdateOffer');
        break;

      case CacheEventTypeEnum.ScamUpdate:
        const profileScamUpdate = new CpuProfiler();
        await this.assetScamInfoRedisHandler.clearKey(event.id);
        profileScamUpdate.stop('ScamUpdate');
        break;

      case CacheEventTypeEnum.Minters:
        const profileMinters = new CpuProfiler();
        await this.cacheMintersService.invalidateMinters();
        profileMinters.stop('Minters');
        break;

      case CacheEventTypeEnum.Marketplaces:
        const profileMarketplaces = new CpuProfiler();
        if (event.id) await this.marketplaceRedisHandler.clearKey(event.id);
        await this.cacheMarketplacesService.invalidateCache(event.id, event.extraInfo?.collection, event.address);
        profileMarketplaces.stop('Marketplaces');
        break;

      case CacheEventTypeEnum.Campaigns:
        const profileCampaigns = new CpuProfiler();
        this.cacheCampaignsService.invalidateCache();
        profileCampaigns.stop('Campaigns');
        break;
      // case CacheEventTypeEnum.RefreshTrending:
      //   await this.cacheInvalidationEventsService.invalidateTrendingAuctions(
      //     event,
      //   );
      //   break;
    }
  }
}
