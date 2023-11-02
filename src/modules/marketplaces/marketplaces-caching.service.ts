import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { CacheService, RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Marketplace } from './models';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MarketplacesCachingService {
  constructor(private cacheService: CacheService, @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy) {}

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
    await this.cacheService.delete(CacheInfo.AllMarketplaces.key);
    await this.refreshCacheKey(CacheInfo.AllMarketplaces.key, CacheInfo.AllMarketplaces.ttl);
  }

  private async invalidateCollectionsByMarketplace(key: string) {
    await this.cacheService.delete(`${CacheInfo.CollectionsByMarketplace.key}_${key}`);
    await this.refreshCacheKey(`${CacheInfo.CollectionsByMarketplace.key}_${key}`, CacheInfo.CollectionsByMarketplace.ttl);
  }

  private async invalidateMarketplaceByCollection(key: string) {
    await this.cacheService.delete(`${CacheInfo.MarketplaceCollection.key}_${key}`);
    await this.refreshCacheKey(`${CacheInfo.MarketplaceCollection.key}_${key}`, CacheInfo.MarketplaceCollection.ttl);
  }

  private async invalidateMarketplaceByAddressAndCollection(key: string) {
    await this.cacheService.delete(`${CacheInfo.MarketplaceAddressCollection.key}_${key}`);
    await this.refreshCacheKey(`${CacheInfo.MarketplaceAddressCollection.key}_${key}`, CacheInfo.MarketplaceAddressCollection.ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit<{
      key: string;
      ttl: number;
    }>('refreshCacheKey', {
      key,
      ttl,
    });
  }
}
