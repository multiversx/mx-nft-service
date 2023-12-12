import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import '../../utils/extensions';
import { CollectionType } from '../assets/models/Collection.type';
import { Marketplace } from './models';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { MarketplaceCollectionEntity, MarketplaceEntity } from 'src/db/marketplaces';
import { MarketplaceState, MarketplaceTypeEnum } from './models/MarketplaceType.enum';
import { MarketplaceFilters } from './models/Marketplace.Filter';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { RemoveWhitelistCollectionRequest, WhitelistCollectionRequest } from './models/requests/WhitelistCollectionOnMarketplaceRequest';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { WhitelistMarketplaceRequest } from './models/requests/WhitelistMarketplaceRequest';
import { UpdateMarketplaceRequest } from './models/requests/UpdateMarketplaceRequest';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { ChangedEvent, CacheEventTypeEnum } from '../rabbitmq/cache-invalidation/events/changed.event';
import { mxConfig } from 'src/config';
import { DisabledMarketplaceEventsService } from '../rabbitmq/blockchain-events/disable-marketplace/disable-marketplace-events.service';

@Injectable()
export class MarketplacesService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly cacheService: MarketplacesCachingService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
    @Inject(forwardRef(() => DisabledMarketplaceEventsService))
    private readonly marketplaceService: DisabledMarketplaceEventsService,
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

    const externalMarketplaces = allMarketplaces?.items?.filter(
      (m) => m.type === MarketplaceTypeEnum.External && m.state === MarketplaceState.Enable,
    );

    return externalMarketplaces.map((m) => m.address);
  }

  async getDisabledMarketplacesAddreses(): Promise<string[]> {
    let allMarketplaces = await this.getAllMarketplaces();

    const disabledMarketplaces = allMarketplaces?.items?.filter((m) => m.state === MarketplaceState.Disable);

    return disabledMarketplaces.map((m) => m.address);
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
    const allMarketplaces = await this.getAllMarketplaces();
    const internalMarketplaces = allMarketplaces?.items?.filter(
      (m) => m.type === MarketplaceTypeEnum.Internal && m.state === MarketplaceState.Enable,
    );
    return internalMarketplaces;
  }

  async getMarketplacesFromDb(): Promise<CollectionType<Marketplace>> {
    const [marketplaces, count]: [MarketplaceEntity[], number] = await this.persistenceService.getMarketplaces();
    return new CollectionType({
      count: count,
      items: marketplaces.map((marketplace) => Marketplace.fromEntity(marketplace)),
    });
  }

  async getMarketplaceByAddressAndCollectionFromDb(collection: string, address: string): Promise<Marketplace> {
    const marketplace: MarketplaceEntity[] = await this.persistenceService.getMarketplaceByAddressAndCollection(collection, address);
    return marketplace?.length > 0 ? Marketplace.fromEntity(marketplace[0]) : null;
  }

  async getMarketplaceByKeyAndCollectionFromDb(collection: string, address: string): Promise<Marketplace> {
    const marketplace: MarketplaceEntity[] = await this.persistenceService.getMarketplaceByKeyAndCollection(collection, address);
    return marketplace?.length > 0 ? Marketplace.fromEntity(marketplace[0]) : null;
  }

  async getMarketplaceByAddress(address: string): Promise<Marketplace> {
    const marketplace: MarketplaceEntity = await this.persistenceService.getMarketplaceByAddress(address);
    return marketplace ? Marketplace.fromEntity(marketplace) : null;
  }

  async whitelistCollectionOnMarketplace(request: WhitelistCollectionRequest): Promise<Boolean> {
    const marketplace = await this.persistenceService.getMarketplaceByKey(request.marketplaceKey);
    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this key');
    }

    const savedCollection = await this.persistenceService.getMarketplaceByKeyAndCollection(request.collection, request.marketplaceKey);
    if (savedCollection?.length) {
      return true;
    }

    try {
      const savedCollection = await this.persistenceService.saveMarketplaceCollection(
        new MarketplaceCollectionEntity({
          collectionIdentifier: request.collection,
          marketplaces: [marketplace],
        }),
      );

      if (savedCollection) {
        this.triggerCacheInvalidation(request.marketplaceKey, request.collection, marketplace.address);
      }
      return savedCollection;
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

  async removeWhitelistCollection(request: RemoveWhitelistCollectionRequest): Promise<Boolean> {
    const collection = await this.persistenceService.getCollectionByKeyAndCollection(request.collection, request.marketplaceKey);
    const marketplace = await this.persistenceService.getMarketplaceByKey(request.marketplaceKey);

    if (!collection || !marketplace) {
      throw new BadRequestError('Marketplace not available for this key, choose another key if this is not your marketplace');
    }
    try {
      const removedCollection = await this.persistenceService.deleteMarketplaceCollection(collection);

      if (removedCollection) {
        this.triggerCacheInvalidation(request.marketplaceKey, request.collection, marketplace.address);
      }
      return removedCollection ? true : false;
    } catch (error) {
      this.logger.error('An error has occured while remove whitelist for collection', {
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
      const savedMarketplace = await this.persistenceService.saveMarketplace(
        new MarketplaceEntity({
          key: request.marketplaceKey,
          address: request.marketplaceScAddress ?? mxConfig.nftMarketplaceAddress,
          name: request.marketplaceName,
          url: request.marketplaceUrl,
          type: MarketplaceTypeEnum.Internal,
          state: MarketplaceState.Enable,
        }),
      );

      if (savedMarketplace) {
        this.triggerCacheInvalidation(request.marketplaceKey);
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

  async disableMarketplace(address: string, marketplaceState: MarketplaceState): Promise<boolean> {
    const marketplaces = await this.persistenceService.getMarketplacesByAddress(address);

    if (!marketplaces || marketplaces.length === 0) {
      throw new BadRequestError('No marketplace with this address');
    }
    try {
      marketplaces?.forEach((m) => (m.state = marketplaceState));

      const updatedMarketplaces = await this.persistenceService.saveMarketplaces(marketplaces);

      if (updatedMarketplaces) {
        for (const updatedMarketplace of updatedMarketplaces) {
          this.triggerCacheInvalidation(updatedMarketplace.key, null, updatedMarketplace.address);
        }
      }

      return !!updatedMarketplaces;
    } catch (error) {
      this.logger.error('An error has occurred while disabaling marketplace state', {
        path: this.updateMarketplaceState.name,
        marketplace: address,
        exception: error,
      });
      return false;
    }
  }

  async enableMarketplace(address: string, marketplaceState: MarketplaceState): Promise<boolean> {
    const marketplaces = await this.persistenceService.getMarketplacesByAddress(address);
    if (!marketplaces || marketplaces.length === 0) {
      throw new BadRequestError('No marketplace with this address');
    }
    try {
      await this.marketplaceService.processMissedEventsSinceDisabled(marketplaces);
      marketplaces?.forEach((m) => (m.state = marketplaceState));

      const updatedMarketplaces = await this.persistenceService.saveMarketplaces(marketplaces);

      if (updatedMarketplaces) {
        for (const updatedMarketplace of updatedMarketplaces) {
          this.triggerCacheInvalidation(updatedMarketplace.key, null, updatedMarketplace.address);
        }
      }

      return !!updatedMarketplaces;
    } catch (error) {
      this.logger.error('An error has occurred while enabeling marketplace', {
        path: this.updateMarketplaceState.name,
        marketplace: address,
        exception: error,
      });
      return false;
    }
  }

  async updateMarketplace(request: UpdateMarketplaceRequest): Promise<Boolean> {
    const marketplace = await this.persistenceService.getMarketplaceByKey(request.marketplaceKey);
    if (!marketplace) {
      throw new BadRequestError('No marketplace available for this key');
    }
    try {
      const updatedMarketplace = await this.persistenceService.updateMarketplace(
        new MarketplaceEntity({
          key: request.marketplaceKey,
          address: request.marketplaceScAddress ?? marketplace.address,
          name: request.marketplaceName ?? marketplace.name,
          url: request.marketplaceUrl ?? marketplace.url,
          type: marketplace.type ?? MarketplaceTypeEnum.Internal,
          state: marketplace.state,
        }),
      );

      if (updatedMarketplace) {
        this.triggerCacheInvalidation(request.marketplaceKey);
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
    this.persistenceService.updateMarketplaceLastIndexTimestampByAddress(address, lastIndexTimestamp);
  }

  private async getCollectionsByMarketplaceFromDb(marketplaceKey: string): Promise<string[]> {
    const collections = await this.persistenceService.getCollectionsByMarketplace(marketplaceKey);
    return collections.map((c) => c.collectionIdentifier);
  }

  private async triggerCacheInvalidation(marketplaceKey: string, collection?: string, address?: string): Promise<void> {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        type: CacheEventTypeEnum.Marketplaces,
        id: marketplaceKey,
        address: address,
        extraInfo: { collection: collection },
      }),
    );
  }

  private async updateMarketplaceState(marketplaces: MarketplaceEntity[], marketplaceState: MarketplaceState) {
    marketplaces?.forEach((m) => (m.state = marketplaceState));

    const updatedMarketplaces = await this.persistenceService.saveMarketplaces(marketplaces);

    if (updatedMarketplaces) {
      for (const updatedMarketplace of updatedMarketplaces) {
        this.triggerCacheInvalidation(updatedMarketplace.key, null, updatedMarketplace.address);
      }
    }

    return !!updatedMarketplaces;
  }
}
