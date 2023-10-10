import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Marketplace } from './models';

@Injectable()
export class MarketplacesCachingService {
  constructor(private cacheService: CacheService) {}

  public async getAllMarketplaces(getMarketplaces: () => any): Promise<CollectionType<Marketplace>> {
    return await this.cacheService.getOrSet(CacheInfo.AllMarketplaces.key, () => getMarketplaces(), Constants.oneHour());
  }

  public async getMarketplaceByAddressAndCollection(getMarketplaceByAddress: () => any, key: string): Promise<Marketplace> {
    return await this.cacheService.getOrSet(
      `${CacheInfo.MarketplaceAddressCollection.key}_${key}`,
      () => getMarketplaceByAddress(),
      CacheInfo.MarketplaceAddressCollection.ttl,
    );
  }

  public async getMarketplaceByCollection(getMarketplaceByCollection: () => any, key: string): Promise<Marketplace> {
    return await this.cacheService.getOrSet(
      `${CacheInfo.MarketplaceCollection.key}_${key}`,
      () => getMarketplaceByCollection(),
      CacheInfo.MarketplaceCollection.ttl,
    );
  }

  public async getCollectionsByMarketplace(getCollectionsByMarketplace: () => any, key: string): Promise<string[]> {
    return await this.cacheService.getOrSet(
      `${CacheInfo.CollectionsByMarketplace.key}_${key}`,
      () => getCollectionsByMarketplace(),
      CacheInfo.CollectionsByMarketplace.ttl,
    );
  }

  public async invalidateCache(key: string, collection: string, address: string) {
    await this.invalidateMarketplacesCache();
    if (key) await this.invalidateCollectionsByMarketplace(key);
    if (collection) {
      await this.invalidateMarketplaceByCollection(collection);
      await this.invalidateMarketplaceByAddressAndCollection(`${collection}_${address}`);
    }
  }

  private async invalidateMarketplacesCache() {
    console.log('invalidateMarketplacesCache');
    await this.cacheService.deleteInCache(CacheInfo.AllMarketplaces.key);
  }

  private async invalidateCollectionsByMarketplace(key: string) {
    console.log('invalidateCollectionsByMarketplace', key);
    await this.cacheService.deleteInCache(`${CacheInfo.CollectionsByMarketplace.key}_${key}`);
  }

  private async invalidateMarketplaceByCollection(key: string) {
    console.log('invalidateMarketplaceByCollection', key);
    await this.cacheService.deleteInCache(`${CacheInfo.MarketplaceCollection.key}_${key}`);
  }

  private async invalidateMarketplaceByAddressAndCollection(key: string) {
    console.log('invalidateMarketplaceByAddressAndCollection', key);
    await this.cacheService.deleteInCache(`${CacheInfo.MarketplaceAddressCollection.key}_${key}`);
  }
}
