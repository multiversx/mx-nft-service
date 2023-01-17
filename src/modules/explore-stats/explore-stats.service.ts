import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import {
  ExploreCollectionsStats,
  ExploreNftsStats,
  ExploreStats,
} from './models/Explore-Stats.dto';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { AuctionsGetterService } from '../auctions';
import {
  buyNowAuctionRequest,
  runningAuctionRequest,
} from '../auctions/auctionsRequest';

@Injectable()
export class ExploreStatsService {
  private redisClient: Redis.Redis;
  constructor(
    private cachingService: CachingService,
    private collectionsService: CollectionsGetterService,
    private auctionsService: AuctionsGetterService,
    private apiService: MxApiService,
  ) {
    this.redisClient = this.cachingService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getExploreStats(): Promise<ExploreStats> {
    const [, collections] =
      await this.collectionsService.getOrSetFullCollections();
    const nfts = await this.getOrSetTotalNftsCount();
    const [, artists] =
      await this.collectionsService.getOrSetMostActiveCollections();
    return new ExploreStats({ collections, nfts, artists });
  }

  async getExploreCollectionsStats(): Promise<ExploreCollectionsStats> {
    const [collections, allCollectionsCount] =
      await this.collectionsService.getOrSetFullCollections();
    const verifiedCount = collections.filter(
      (token) => token.verified === true,
    ).length;
    const [, activeLast30DaysCount] =
      await this.collectionsService.getActiveCollectionsFromLast30Days();
    return new ExploreCollectionsStats({
      allCollectionsCount,
      verifiedCount,
      activeLast30DaysCount,
    });
  }

  async getExpoloreNftsStats(): Promise<ExploreNftsStats> {
    const allNftsCount = await this.getOrSetTotalNftsCount();

    const [, buyNowCount] =
      await this.auctionsService.getAuctionsGroupByIdentifier(
        buyNowAuctionRequest,
      );

    const [, liveAuctionsCount] =
      await this.auctionsService.getAuctionsGroupByIdentifier(
        runningAuctionRequest,
      );

    return new ExploreNftsStats({
      allNftsCount,
      buyNowCount,
      liveAuctionsCount,
    });
  }

  async getOrSetTotalNftsCount(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      this.redisClient,
      CacheInfo.NftsCount.key,
      async () => await this.apiService.getNftsCount(),
      CacheInfo.NftsCount.ttl,
    );
  }
}
