import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { CachingService, Constants } from '@multiversx/sdk-nestjs';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Marketplace } from './models';

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
      `${CacheInfo.MarketplaceAddressCollection.key}_${key}`,
      () => getMarketplaceByAddress(),
      CacheInfo.MarketplaceAddressCollection.ttl,
    );
  }

  public async getMarketplaceByCollection(
    getMarketplaceByCollection: () => any,
    key: string,
  ): Promise<Marketplace> {
    return await this.cacheService.getOrSetCache(
      `${CacheInfo.MarketplaceCollection.key}_${key}`,
      () => getMarketplaceByCollection(),
      CacheInfo.MarketplaceCollection.ttl,
    );
  }

  public async getCollectionsByMarketplace(
    getCollectionsByMarketplace: () => any,
    key: string,
  ): Promise<string[]> {
    return await this.cacheService.getOrSetCache(
      `${CacheInfo.CollectionsByMarketplace.key}_${key}`,
      () => getCollectionsByMarketplace(),
      CacheInfo.CollectionsByMarketplace.ttl,
    );
  }

  public async invalidateMarketplacesCache() {
    await this.cacheService.deleteInCache(CacheInfo.AllMarketplaces.key);
  }

  public async invalidateCollectionsByMarketplace(key: string) {
    await this.cacheService.deleteInCache(
      `${CacheInfo.CollectionsByMarketplace.key}_${key}`,
    );
  }
  public async invalidateMarketplaceByCollection(key: string) {
    await this.cacheService.deleteInCache(
      `${CacheInfo.MarketplaceCollection.key}_${key}`,
    );
  }
  public async invalidateMarketplaceByAddressAndCollection(key: string) {
    await this.cacheService.deleteInCache(
      `${CacheInfo.MarketplaceAddressCollection.key}_${key}`,
    );
  }
}
