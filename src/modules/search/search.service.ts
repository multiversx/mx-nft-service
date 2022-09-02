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
import {
  SearchNftCollectionResponse,
  SearchItemResponse,
} from './models/SearchItemResponse';
import { CollectionsService } from '../nftCollections/collection.service';

@Injectable()
export class SearchService {
  private redisClient: Redis.Redis;
  private readonly searchSize: number = 5;
  private fieldsRequested: string = 'identifier,name,assets';
  constructor(
    private accountsService: ElrondIdentityService,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private collectionsService: CollectionsService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getHerotagForAddress(address: string): Promise<any> {
    try {
      const cacheKey = this.getAddressHerotagCacheKey(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        () => this.getAddressHerotag(address),
        5 * TimeConstants.oneMinute,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting herotags for search term',
        {
          path: this.getHerotagForAddress.name,
          address,
          exception: err?.message,
        },
      );
      return [];
    }
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

  private async getAddressHerotag(
    address: string,
  ): Promise<SearchItemResponse> {
    const herotagsResponse = await this.accountsService.getProfile(address);
    return new SearchItemResponse({
      identifier: address,
      name: herotagsResponse ? herotagsResponse.herotag : undefined,
    });
  }

  private async getMappedHerotags(
    searchTerm: string,
    limit: number = 5,
  ): Promise<SearchItemResponse[]> {
    const herotagsResponse = await this.accountsService.getAcountsByHerotag(
      searchTerm,
    );
    const herotags = herotagsResponse?.herotags.slice(0, limit);
    const addresses = herotags.map((hero) =>
      this.accountsService.getAddressByHerotag(hero),
    );
    const response = await Promise.all(addresses);
    return response?.map(
      (r) =>
        new SearchItemResponse({
          identifier: r.address,
          name: r.herotag,
        }),
    );
  }

  private getAccountsCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_account', searchTerm);
  }

  private getAddressHerotagCacheKey(address: string) {
    return generateCacheKeyFromParams('address_herotag', address);
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

  private async getMappedCollections(
    searchTerm: string,
  ): Promise<SearchItemResponse[]> {
    const [collections, count] = await this.collectionsService.getFullCollections();
    let allResults = collections.filter(x => x.verified && x.name?.toLowerCase()?.includes(searchTerm.toLowerCase())).slice(0, 5);
    if (allResults.length < 5) {
      const nonVerifiedResults = collections.filter(x => !x.verified && x.name?.toLowerCase()?.includes(searchTerm.toLowerCase())).slice(0, 5 - allResults.length);
      allResults.push(...nonVerifiedResults);
    }

    const result = allResults.map(result => new SearchNftCollectionResponse({
      identifier: result.collection,
      name: result.name,
      verified: result.verified
    }));

    return result;
  }

  private getCollectionCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_collection', searchTerm);
  }

  async getNfts(searchTerm: string): Promise<SearchNftCollectionResponse[]> {
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

  private async getMappedNfts(
    searchTerm: string,
  ): Promise<SearchItemResponse[]> {
    if (searchTerm.match(NFT_IDENTIFIER_RGX)) {
      const response = await this.apiService.getNftByIdentifierForQuery(
        searchTerm,
        `fields=${this.fieldsRequested}`,
      );
      return [
        new SearchNftCollectionResponse({
          identifier: response?.identifier,
          name: response?.name,
          verified: !!response.assets,
        }),
      ];
    }
    const response = await this.apiService.getNftsBySearch(
      searchTerm,
      this.searchSize,
      this.fieldsRequested,
    );
    return response?.map(
      (c) =>
        new SearchNftCollectionResponse({
          identifier: c?.identifier,
          name: c?.name,
          verified: !!c.assets,
        }),
    );
  }

  private getNftsCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_nfts', searchTerm);
  }

  async getTags(searchTerm: string): Promise<SearchItemResponse[]> {
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

  private async getMappedTags(
    searchTerm: string,
  ): Promise<SearchItemResponse[]> {
    const response = await this.apiService.getTagsBySearch(searchTerm);
    return response?.map((c) => new SearchItemResponse({ identifier: c.tag }));
  }

  private getTagsCacheKey(searchTerm: string) {
    return generateCacheKeyFromParams('search_tag', searchTerm);
  }
}
