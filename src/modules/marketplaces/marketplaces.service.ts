import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { CollectionType } from '../assets/models/Collection.type';
import { Marketplace } from './models';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { MarketplaceCollectionEntity, MarketplaceEntity } from 'src/db/marketplaces';
import { MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { MarketplaceFilters } from './models/Marketplace.Filter';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { WhitelistCollectionRequest } from './models/requests/WhitelistCollectionOnMarketplaceRequest';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { WhitelistMarketplaceRequest } from './models/requests/WhitelistMarketplaceRequest';
import { UpdateMarketplaceRequest } from './models/requests/UpdateMarketplaceRequest';

@Injectable()
export class MarketplacesService {
  constructor(
    private persistenceService: PersistenceService,
    private cacheService: MarketplacesCachingService,
    private readonly logger: Logger,
  ) {}

  async getMarketplaces(limit: number = 10, offset: number = 0, filters?: MarketplaceFilters): Promise<CollectionType<Marketplace>> {
    let allMarketplaces = await this.getAllMarketplaces();

    if (filters?.marketplaceKey && filters?.marketplaceAddress) {
      const marketplace = allMarketplaces?.items?.find(
        (m) => m.key === filters?.marketplaceKey && m.address === filters.marketplaceAddress,
      );

      return new CollectionType({
        count: marketplace ? 1 : 0,
        items: [marketplace],
      });
    }
    if (filters?.marketplaceKey) {
      const marketplace = allMarketplaces?.items?.find((m) => m.key === filters?.marketplaceKey);

      return new CollectionType({
        count: marketplace ? 1 : 0,
        items: [marketplace],
      });
    }

    if (filters?.marketplaceAddress) {
      let marketplaces = allMarketplaces?.items?.filter((m) => m.address === filters?.marketplaceAddress);
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

  async getInternalMarketplacesByAddress(address: string): Promise<Marketplace[]> {
    const internalMarketplaces = await this.getInternalMarketplaces();
    return internalMarketplaces.filter((m) => m.address === address);
  }

  async getInternalMarketplacesAddreses(): Promise<string[]> {
    const internalMarketplaces = await this.getInternalMarketplaces();
    return internalMarketplaces.map((m) => m.address);
  }

  async getExternalMarketplacesAddreses(): Promise<string[]> {
    let allMarketplaces = await this.getAllMarketplaces();

    const externalMarketplaces = allMarketplaces?.items?.filter((m) => m.type === MarketplaceTypeEnum.External);

    return externalMarketplaces.map((m) => m.address);
  }

  async getMarketplacesAddreses(): Promise<string[]> {
    let allMarketplaces = await this.getAllMarketplaces();

    return allMarketplaces.items.map((m) => m.address);
  }

  async getMarketplaceAddressByKey(marketplaceKey: string): Promise<string> {
    let allMarketplaces = await this.getAllMarketplaces();

    const marketplaceAddress = allMarketplaces?.items?.find((m) => m.key === marketplaceKey);

    return marketplaceAddress?.address;
  }

  async getMarketplaceByKey(marketplaceKey: string): Promise<Marketplace> {
    let allMarketplaces = await this.getAllMarketplaces();

    return allMarketplaces?.items?.find((m) => m.key === marketplaceKey);
  }

  async getMarketplaceByCollectionAndAddress(collection: string, address: string): Promise<Marketplace> {
    return await this.cacheService.getMarketplaceByAddressAndCollection(
      () => this.getMarketplaceByAddressAndCollectionFromDb(collection, address),
      `${collection}_${address}`,
    );
  }

  async getMarketplaceByType(
    contractAddress: string,
    marketplaceType: MarketplaceTypeEnum,
    collectionIdentifier?: string,
  ): Promise<Marketplace> {
    if (marketplaceType === MarketplaceTypeEnum.Internal) {
      return await this.getMarketplaceByCollectionAndAddress(collectionIdentifier, contractAddress);
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
    return await this.cacheService.getAllMarketplaces(() => this.getMarketplacesFromDb());
  }

  private async getInternalMarketplaces(): Promise<Marketplace[]> {
    let allMarketplaces = await this.getAllMarketplaces();
    const internalMarketplaces = allMarketplaces?.items?.filter((m) => m.type === MarketplaceTypeEnum.Internal);
    return internalMarketplaces;
  }

  async getMarketplacesFromDb(): Promise<CollectionType<Marketplace>> {
    let [campaigns, count]: [MarketplaceEntity[], number] = await this.persistenceService.getMarketplaces();
    return new CollectionType({
      count: count,
      items: campaigns.map((campaign) => Marketplace.fromEntity(campaign)),
    });
  }

  async getMarketplaceByAddressAndCollectionFromDb(collection: string, address: string): Promise<Marketplace> {
    let marketplace: MarketplaceEntity[] = await this.persistenceService.getMarketplaceByAddressAndCollection(collection, address);
    return marketplace?.length > 0 ? Marketplace.fromEntity(marketplace[0]) : null;
  }

  async getMarketplaceByAddress(address: string): Promise<Marketplace> {
    let marketplace: MarketplaceEntity = await this.persistenceService.getMarketplaceByAddress(address);
    return marketplace ? Marketplace.fromEntity(marketplace) : null;
  }

  async whitelistCollectionOnMarketplace(request: WhitelistCollectionRequest): Promise<Boolean> {
    const marketplace = await this.persistenceService.getMarketplaceByKey(request.marketplaceKey);
    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this key');
    }
    try {
      let savedCollection = await this.persistenceService.saveMarketplaceCollection(
        new MarketplaceCollectionEntity({
          collectionIdentifier: request.collection,
          marketplaces: [marketplace],
        }),
      );

      if (savedCollection) {
        this.cacheService.invalidateMarketplacesCache();
        this.cacheService.invalidateMarketplaceByCollection(request.collection);
        this.cacheService.invalidateCollectionsByMarketplace(request.marketplaceKey);
      }
      return savedCollection ? true : false;
    } catch (error) {
      this.logger.error('An error has occured while whitelisting collection', {
        path: this.whitelistCollectionOnMarketplace.name,
        collection: request?.collection,
        marketplace: request?.marketplaceKey,
        exception: error,
      });
      return false;
    }
  }

  async whitelistMarketplace(request: WhitelistMarketplaceRequest): Promise<Boolean> {
    const marketplace = await this.persistenceService.getMarketplaceByKey(request.marketplaceKey);
    if (marketplace) {
      throw new BadRequestError('Marketplace available for this key, choose another key if this is not your marketplace');
    }
    try {
      let savedMarketplace = await this.persistenceService.saveMarketplace(
        new MarketplaceEntity({
          key: request.marketplaceKey,
          address: request.marketplaceScAddress,
          name: request.marketplaceName,
          url: request.marketplaceUrl,
          type: MarketplaceTypeEnum.Internal,
        }),
      );

      if (savedMarketplace) {
        // TODO: invalidate caching corectly, send event
        this.cacheService.invalidateMarketplacesCache();
        this.cacheService.invalidateCollectionsByMarketplace(request.marketplaceKey);
      }
      return savedMarketplace ? true : false;
    } catch (error) {
      this.logger.error('An error has occured while whitelisting marketplace', {
        path: this.whitelistCollectionOnMarketplace.name,
        marketplace: request?.marketplaceKey,
        exception: error,
      });
      return false;
    }
  }

  async updateMarketplace(request: UpdateMarketplaceRequest): Promise<Boolean> {
    const marketplace = await this.persistenceService.getMarketplaceByKey(request.marketplaceKey);
    if (marketplace) {
      throw new BadRequestError('No marketplace available for this key');
    }
    try {
      let updatedMarketplace = await this.persistenceService.updateMarketplace(
        new MarketplaceEntity({
          key: request.marketplaceKey,
          address: marketplace.address ?? request.marketplaceScAddress,
          name: marketplace.name ?? request.marketplaceName,
          url: marketplace.url ?? request.marketplaceUrl,
          type: marketplace.type ?? MarketplaceTypeEnum.Internal,
        }),
      );

      if (updatedMarketplace) {
        // TODO: invalidate caching corectly, send event
        this.cacheService.invalidateMarketplacesCache();
        this.cacheService.invalidateCollectionsByMarketplace(request.marketplaceKey);
      }
      return updatedMarketplace;
    } catch (error) {
      this.logger.error('An error has occured while whitelisting marketplace', {
        path: this.whitelistCollectionOnMarketplace.name,
        marketplace: request?.marketplaceKey,
        exception: error,
      });
      return false;
    }
  }

  async getAllCollectionsIdentifiersFromDb(): Promise<string[]> {
    const collections = await this.persistenceService.getAllMarketplaceCollections();
    return collections.map((c) => c.collectionIdentifier);
  }

  async updateMarketplaceLastIndexTimestampByAddress(address: string, lastIndexTimestamp: number): Promise<void> {
    await this.persistenceService.updateMarketplaceLastIndexTimestampByAddress(address, lastIndexTimestamp);
  }

  private async getCollectionsByMarketplaceFromDb(marketplaceKey: string): Promise<string[]> {
    const collections = await this.persistenceService.getCollectionsByMarketplace(marketplaceKey);
    return collections.map((c) => c.collectionIdentifier);
  }
}
