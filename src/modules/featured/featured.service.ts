import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { Asset } from '../assets/models';
import { Collection } from '../nftCollections/models';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { FeaturedCollectionsFilter } from './Featured-Collections.Filter';
import { FeaturedCollectionTypeEnum } from './FeatureCollectionType.enum';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class FeaturedService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private persistenceService: PersistenceService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.assetsRedisClientName,
    );
  }

  async getFeaturedNfts(
    limit: number = 10,
    offset: number,
  ): Promise<[Asset[], number]> {
    try {
      const cacheKey = this.getFeaturedNftsCacheKey(limit, offset);
      const getAssetLiked = () =>
        this.persistenceService.getFeaturedNfts(limit, offset);
      const [featuredNfts, count] = await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssetLiked,
        CacheInfo.FeaturedNfts.ttl,
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

  private getFeaturedNftsCacheKey(limit: number, offset: number) {
    return generateCacheKeyFromParams(
      CacheInfo.FeaturedNfts.key,
      limit,
      offset,
    );
  }

  async getFeaturedCollections(
    limit: number = 10,
    offset: number,
    filters: FeaturedCollectionsFilter,
  ): Promise<[Collection[], number]> {
    try {
      const cacheKey = this.getFeaturedCollectionsCacheKey(limit, offset);
      const getFeaturedCollections = () =>
        this.persistenceService.getFeaturedCollections(limit, offset);
      let [featuredCollections, count] = await this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getFeaturedCollections,
        CacheInfo.FeaturedCollections.ttl,
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
    await this.redisCacheService.delByPattern(
      this.redisClient,
      CacheInfo.FeaturedCollections.key,
    );
  }

  private getFeaturedCollectionsCacheKey(limit: number, offset: number) {
    return generateCacheKeyFromParams(
      CacheInfo.FeaturedCollections.key,
      limit,
      offset,
    );
  }
}
