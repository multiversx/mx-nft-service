import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { CollectionType } from '../assets/models/Collection.type';
import { Marketplace } from './models';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { MarketplaceEntity } from 'src/db/marketplaces';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { MarketplaceFilters } from './models/Marketplace.Filter';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class MarketplacesService {
  constructor(
    private persistenceService: PersistenceService,
    private cacheService: MarketplacesCachingService,
  ) { }

  async getMarketplaces(
    limit: number = 10,
    offset: number = 0,
    filters?: MarketplaceFilters,
  ): Promise<CollectionType<Marketplace>> {
    let allMarketplaces = await this.getAllMarketplaces();

    if (filters?.marketplaceKey && filters?.marketplaceAddress) {
      const marketplace = allMarketplaces?.items?.find(
        (m) =>
          m.key === filters?.marketplaceKey &&
          m.address === filters.marketplaceAddress,
      );

      return new CollectionType({
        count: marketplace ? 1 : 0,
        items: [marketplace],
      });
    }
    if (filters?.marketplaceKey) {
      const marketplace = allMarketplaces?.items?.find(
        (m) => m.key === filters?.marketplaceKey,
      );

      return new CollectionType({
        count: marketplace ? 1 : 0,
        items: [marketplace],
      });
    }

    if (filters?.marketplaceAddress) {
      let marketplaces = allMarketplaces?.items?.filter(
        (m) => m.address === filters?.marketplaceAddress,
      );
      marketplaces = marketplaces?.slice(offset, offset + limit);
      return new CollectionType({
        count: marketplaces?.length,
        items: marketplaces,
      });
    }
    const marketplaces = allMarketplaces?.items?.slice(offset, offset + limit);

    return new CollectionType({
      count: marketplaces?.length,
      items: marketplaces,
    });
  }

  async getInternalMarketplacesByAddress(
    address: string,
  ): Promise<Marketplace[]> {
    const internalMarketplaces = await this.getInternalMarketplaces();
    return internalMarketplaces.filter((m) => m.address === address);
  }

  async getInternalMarketplacesAddreses(): Promise<string[]> {
    const internalMarketplaces = await this.getInternalMarketplaces();
    return internalMarketplaces.map((m) => m.address);
  }

  async getExternalMarketplacesAddreses(): Promise<string[]> {
    let allMarketplaces = await this.getAllMarketplaces();

    const externalMarketplaces = allMarketplaces?.items?.filter(
      (m) => m.type === MarketplaceTypeEnum.External,
    );

    return externalMarketplaces.map((m) => m.address);
  }

  async getMarketplacesAddreses(): Promise<string[]> {
    let allMarketplaces = await this.getAllMarketplaces();

    return allMarketplaces.items.map((m) => m.address);
  }

  async getMarketplaceByKey(marketplaceKey: string): Promise<string[]> {
    let allMarketplaces = await this.getAllMarketplaces();

    const externalMarketplaces = allMarketplaces?.items?.filter(
      (m) => m.key === marketplaceKey,
    );

    return externalMarketplaces.map((m) => m.address);
  }

  async getInternalMarketplacesAddresesByKey(key: string): Promise<string> {
    let allMarketplaces = await this.getAllMarketplaces();

    const internalMarketplace = allMarketplaces?.items?.find(
      (m) => m.key === key,
    );

    return internalMarketplace?.address;
  }

  async getMarketplaceByCollectionAndAddress(
    collection: string,
    address: string,
  ): Promise<Marketplace> {
    return await this.cacheService.getMarketplaceByAddressAndCollection(
      () =>
        this.getMarketplaceByAddressAndCollectionFromDb(collection, address),
      `${collection}_${address}`,
    );
  }

  async getMarketplaceByCollection(collection: string): Promise<Marketplace> {
    return await this.cacheService.getMarketplaceByCollection(
      () => this.getMarketplaceByCollectionFromDb(collection),
      collection,
    );
  }

  async getMarketplaceByType(
    contractAddress: string,
    marketplaceType: MarketplaceTypeEnum,
    collectionIdentifier?: string,
  ): Promise<Marketplace> {
    if (marketplaceType === MarketplaceTypeEnum.Internal) {
      return await this.getMarketplaceByCollectionAndAddress(
        collectionIdentifier,
        contractAddress,
      );
    }
    return await this.getMarketplaceByAddress(contractAddress);
  }

  async getCollectionsByMarketplace(marketplaceKey: string): Promise<string[]> {
    return await this.cacheService.getCollectionsByMarketplace(
      () => this.getCollectionsByMarketplaceFromDb(marketplaceKey),
      marketplaceKey,
    );
  }

  private async getAllMarketplaces(): Promise<CollectionType<Marketplace>> {
    return await this.cacheService.getAllMarketplaces(() =>
      this.getMarketplacesFromDb(),
    );
  }

  private async getInternalMarketplaces(): Promise<Marketplace[]> {
    let allMarketplaces = await this.getAllMarketplaces();
    const internalMarketplaces = allMarketplaces?.items?.filter(
      (m) => m.type === MarketplaceTypeEnum.Internal,
    );
    return internalMarketplaces;
  }

  async getMarketplacesFromDb(): Promise<CollectionType<Marketplace>> {
    let [campaigns, count]: [MarketplaceEntity[], number] =
      await this.persistenceService.getMarketplaces();
    return new CollectionType({
      count: count,
      items: campaigns.map((campaign) => Marketplace.fromEntity(campaign)),
    });
  }

  async getMarketplaceByAddressAndCollectionFromDb(
    collection: string,
    address: string,
  ): Promise<Marketplace> {
    let marketplace: MarketplaceEntity[] =
      await this.persistenceService.getMarketplaceByAddressAndCollection(
        collection,
        address,
      );
    return marketplace?.length > 0
      ? Marketplace.fromEntity(marketplace[0])
      : null;
  }

  async getMarketplaceByAddress(address: string): Promise<Marketplace> {
    let marketplace: MarketplaceEntity =
      await this.persistenceService.getMarketplaceByAddress(address);
    return marketplace ? Marketplace.fromEntity(marketplace) : null;
  }

  async getMarketplaceByCollectionFromDb(
    collection: string,
  ): Promise<Marketplace> {
    let marketplace: MarketplaceEntity[] =
      await this.persistenceService.getMarketplaceByCollection(collection);
    return marketplace?.length > 0
      ? Marketplace.fromEntity(marketplace[0])
      : null;
  }

  async getCollectionsByMarketplaceFromDb(
    marketplaceKey: string,
  ): Promise<string[]> {
    const collections =
      await this.persistenceService.getCollectionsByMarketplace(marketplaceKey);
    return collections.map((c) => c.collectionIdentifier);
  }

  async getAllCollectionsIdentifiersFromDb(): Promise<string[]> {
    const collections = await this.persistenceService.getAllCollections();
    return collections.map((c) => c.collectionIdentifier);
  }

  async updateMarketplaceLastIndexTimestampByAddress(
    address: string,
    lastIndexTimestamp: number,
  ): Promise<void> {
    await this.persistenceService.updateMarketplaceLastIndexTimestampByAddress(
      address,
      lastIndexTimestamp,
    );
  }
}
