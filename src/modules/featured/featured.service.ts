import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { Asset } from '../assets/models';
import { Collection } from '../nftCollections/models';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { FeaturedCollectionsFilter } from './Featured-Collections.Filter';
import { FeaturedCollectionTypeEnum } from './FeatureCollectionType.enum';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { FeaturedCollectionsCachingService } from './featured-caching.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../rabbitmq/cache-invalidation/events/changed.event';

@Injectable()
export class FeaturedService {
  constructor(
    private apiService: ElrondApiService,
    private persistenceService: PersistenceService,
    private readonly logger: Logger,
    private readonly featuredCollectionsCachingService: FeaturedCollectionsCachingService,
    private cacheEventsPublisherService: CacheEventsPublisherService,
  ) {}

  async getFeaturedNfts(
    limit: number = 10,
    offset: number,
  ): Promise<[Asset[], number]> {
    try {
      const getAssetLiked = () =>
        this.persistenceService.getFeaturedNfts(limit, offset);
      const [featuredNfts, count] =
        await this.featuredCollectionsCachingService.getOrSetFeaturedNfts(
          getAssetLiked,
          limit,
          offset,
        );
      const nfts = await this.apiService.getNftsByIdentifiers(
        featuredNfts?.map((x) => x.identifier),
      );
      return [nfts?.map((nft) => Asset.fromNft(nft)), count];
    } catch (err) {
      this.logger.error('An error occurred while loading featured nfts.', {
        path: 'FeaturedNftsService.getFeaturedNfts',
        exception: err,
      });
    }
  }

  async getFeaturedCollections(
    limit: number = 10,
    offset: number,
    filters: FeaturedCollectionsFilter,
  ): Promise<[Collection[], number]> {
    try {
      const getFeaturedCollections = () =>
        this.persistenceService.getFeaturedCollections(limit, offset);
      let [featuredCollections, count] =
        await this.featuredCollectionsCachingService.getOrSetFeaturedCollections(
          getFeaturedCollections,
          limit,
          offset,
        );
      if (filters && filters.type) {
        featuredCollections = featuredCollections.filter(
          (x: { type: FeaturedCollectionTypeEnum }) => x.type === filters.type,
        );
      }
      count = featuredCollections.length;
      featuredCollections = featuredCollections.slice(offset, offset + limit);
      const collections = await this.apiService.getCollectionsByIdentifiers(
        featuredCollections?.map((x) => x.identifier),
      );
      return [
        collections?.map((nft) => Collection.fromCollectionApi(nft)),
        count,
      ];
    } catch (err) {
      this.logger.error(
        'An error occurred while loading featured Collections.',
        {
          path: 'FeaturedService.getFeaturedCollections',
          exception: err,
        },
      );
    }
  }

  async addFeaturedCollection(
    collection: string,
    type: FeaturedCollectionTypeEnum,
  ): Promise<boolean> {
    const isAdded = await this.persistenceService.addFeaturedCollection(
      collection,
      type,
    );
    if (isAdded) {
      await this.invalidateFeaturedCollectionsCache();
    }
    return isAdded;
  }

  async removeFeaturedCollection(collection: string): Promise<boolean> {
    const isRemoved = await this.persistenceService.removeFeaturedCollection(
      collection,
    );
    if (isRemoved) {
      await this.invalidateFeaturedCollectionsCache();
    }
    return isRemoved;
  }

  async invalidateFeaturedCollectionsCache(): Promise<void> {
    await Promise.all([
      this.featuredCollectionsCachingService.invalidateFeaturedCollectionsCache(),
      this.cacheEventsPublisherService.publish(
        new ChangedEvent({
          type: CacheEventTypeEnum.FeaturedCollections,
        }),
      ),
    ]);
  }
}
