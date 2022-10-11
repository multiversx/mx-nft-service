import { Injectable } from '@nestjs/common';
import { ElrondApiService, NftTag } from 'src/common';
import { CachingService } from 'src/common/services/caching/caching.service';
import { Tag } from './models';
import { TagTypeEnum } from './models/Tag-type.enum';
import { TagsFilter } from './models/Tags.Filter';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { TimeConstants } from 'src/utils/time-utils';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class TagsService {
  private redisClient: Redis.Redis;
  constructor(
    private apiService: ElrondApiService,
    private persistenceService: PersistenceService,
    private cacheService: CachingService,
  ) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getTags(
    offset: number = 0,
    limit: number = 10,
    filters: TagsFilter,
  ): Promise<[Tag[], number]> {
    if (filters.tagType === TagTypeEnum.Nft) {
      const [tagsApi, count] = await this.getNftTags(filters, offset, limit);
      const tags = tagsApi?.map((element) => Tag.fromApiTag(element));
      return [tags, count];
    }
    const [tagsApi, count] = await this.getAuctionTags(filters, offset, limit);
    const tags = tagsApi?.slice(offset, offset + limit);
    return [tags, count];
  }

  private async getNftTags(
    filters: TagsFilter,
    offset: number,
    limit: number,
  ): Promise<[Tag[], number]> {
    let [tagsApi, count] = [[], 0];
    if (filters?.searchTerm) {
      [tagsApi, count] = await Promise.all([
        this.apiService.getTags(offset, limit, filters.searchTerm),
        this.apiService.getTagsCount(filters.searchTerm),
      ]);
    } else {
      [tagsApi, count] = await this.getCachedNftTags(offset, limit, filters);
    }

    return [tagsApi, count];
  }

  private async getCachedNftTags(
    offset: number,
    limit: number,
    filters: TagsFilter,
  ): Promise<[NftTag[], number]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      `${CacheInfo.NftTags.key}_${limit}_${offset}`,
      async () =>
        Promise.all([
          this.apiService.getTags(offset, limit, filters.searchTerm),
          this.apiService.getTagsCount(filters.searchTerm),
        ]),
      5 * TimeConstants.oneMinute,
    );
  }

  private async getAuctionTags(
    filters: TagsFilter,
    offset: number,
    limit: number,
  ): Promise<[Tag[], number]> {
    if (filters?.searchTerm) {
      return await this.getAuctionTagsWithSearch(filters, offset, limit);
    } else {
      return await this.cacheService.getOrSetCache(
        this.redisClient,
        CacheInfo.AuctionTags.key,
        async () => await this.getAuctionTagsFromDb(),
        CacheInfo.AuctionTags.ttl,
      );
    }
  }

  async getAuctionTagsFromDb(limit: number = 100): Promise<[Tag[], number]> {
    const [tagsApi, count] = await Promise.all([
      this.persistenceService.getTags(limit),
      this.persistenceService.getTagsCount(),
    ]);
    const tags = tagsApi?.map((element) => Tag.fromApiTag(element));
    return [tags, count];
  }

  async getAuctionTagsWithSearch(
    filters: TagsFilter,
    offset: number,
    limit: number,
  ): Promise<[Tag[], number]> {
    const [tagsApi, count] = await Promise.all([
      this.persistenceService.getTagsBySearchTerm(
        filters.searchTerm,
        offset,
        limit,
      ),
      this.persistenceService.getTagsBySearchTermCount(filters.searchTerm),
    ]);
    const tags = tagsApi?.map((element) => Tag.fromApiTag(element));
    return [tags, count];
  }
}
