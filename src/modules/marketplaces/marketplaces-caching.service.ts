import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { CachingService, Constants } from '@multiversx/sdk-nestjs';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Marketplace } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class MarketplacesCachingService {
  constructor(private cacheService: CachingService) {}

  public async getAllMarketplaces(
    getMarketplaces: () => any,
  ): Promise<CollectionType<Marketplace>> {
    return await this.cacheService.getOrSetCache(
      CacheInfo.AllMarketplaces.key,
      () => getMarketplaces(),
      Constants.oneHour(),
    );
  }

  public async getMarketplaceByAddressAndCollection(
    getMarketplaceByAddress: () => any,
    key: string,
  ): Promise<Marketplace> {
    return await this.cacheService.getOrSetCache(
      generateCacheKeyFromParams('marketplace_address_collection', key),
      () => getMarketplaceByAddress(),
      Constants.oneHour(),
    );
  }

  public async getMarketplaceByCollection(
    getMarketplaceByCollection: () => any,
    key: string,
  ): Promise<Marketplace> {
    return await this.cacheService.getOrSetCache(
      generateCacheKeyFromParams('marketplace_collection', key),
      () => getMarketplaceByCollection(),
      Constants.oneHour(),
    );
  }

  public async getCollectionsByMarketplace(
    getCollectionsByMarketplace: () => any,
    key: string,
  ): Promise<string[]> {
    return await this.cacheService.getOrSetCache(
      generateCacheKeyFromParams('collections_by_marketplace', key),
      () => getCollectionsByMarketplace(),
      30 * Constants.oneMinute(),
    );
  }

  public async invalidateMarketplacesCache() {
    await this.cacheService.deleteInCache(CacheInfo.AllMarketplaces.key);
  }

  public async invalidateCache() {
    await this.cacheService.deleteInCache(CacheInfo.Campaigns.key);
  }
}
