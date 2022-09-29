import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { CollectionsGetterService } from '../nftCollections/collections-getter.service';
import { ExploreStats } from './models/Explore-Stats.dto';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class ExploreStatsService {
  private redisClient: Redis.Redis;
  constructor(
    private cachingService: CachingService,
    private collectionsService: CollectionsGetterService,
    private apiService: ElrondApiService,
  ) {
    this.redisClient = this.cachingService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getStats(): Promise<ExploreStats> {
    const [, collections] =
      await this.collectionsService.getOrSetFullCollections();
    const nfts = await this.getOrSetTotalNftsCount();
    const [, artists] =
      await this.collectionsService.getOrSetMostActiveCollections();
    return new ExploreStats({ collections, nfts, artists });
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
