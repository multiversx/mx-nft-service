import { Inject, Injectable } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondIdentityService,
  RedisCacheService,
} from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@Injectable()
export class SearchService {
  private redisClient: Redis.Redis;
  constructor(
    private accountsService: ElrondIdentityService,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getHerotags(searchTerm: string): Promise<any> {
    try {
      const cacheKey = this.getAccountsCacheKey(searchTerm);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getMappedHerotags(searchTerm),
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting herotags for search term',
        {
          path: this.getHerotags.name,
          searchTerm,
          exception: err?.message,
        },
      );
      return [];
    }
  }

  private async getMappedHerotags(searchTerm: string) {
    const response = await this.accountsService.getAcountsByHerotag(searchTerm);
    return response?.herotags;
  }

  private getAccountsCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_account', searchTerm);
  }

  async getCollections(searchTerm: string): Promise<string[]> {
    try {
      const cacheKey = this.getCollectionCacheKey(searchTerm);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getMappedCollections(searchTerm),
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting collections for search term',
        {
          path: this.getCollections.name,
          searchTerm,
          exception: err?.message,
        },
      );
      return [];
    }
  }

  private async getMappedCollections(searchTerm: string) {
    const response = await this.apiService.getCollectionsBySearch(searchTerm);
    return response?.map((c) => c.collection);
  }

  private getCollectionCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_collection', searchTerm);
  }

  async getNfts(searchTerm: string): Promise<string[]> {
    try {
      const cacheKey = this.getNftsCacheKey(searchTerm);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getMappedNfts(searchTerm),
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting tags for search term',
        {
          path: 'SearchService.getTags',
          searchTerm,
          exception: err?.message,
        },
      );
      return [];
    }
  }

  private async getMappedNfts(searchTerm: string) {
    if (searchTerm.match(NFT_IDENTIFIER_RGX)) {
      const response = await this.apiService.getNftByIdentifierForQuery(
        searchTerm,
        '?fields=identifier',
      );
      return [response?.identifier];
    }
    const response = await this.apiService.getNftsBySearch(searchTerm);
    return response?.map((c) => c.identifier);
  }

  private getNftsCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_nfts', searchTerm);
  }

  async getTags(searchTerm: string): Promise<string[]> {
    try {
      const cacheKey = this.getTagsCacheKey(searchTerm);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getMappedTags(searchTerm),
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting tags for search term',
        {
          path: 'SearchService.getTags',
          searchTerm,
          exception: err?.message,
        },
      );
      return [];
    }
  }

  private async getMappedTags(searchTerm: string) {
    const response = await this.apiService.getTagsBySearch(searchTerm);
    return response?.map((c) => c.tag);
  }

  private getTagsCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_tag', searchTerm);
  }
}
