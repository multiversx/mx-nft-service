import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { BlacklistedCollectionsCachingService } from './blacklisted-collections.caching.service';
import { BlacklistedCollectionEntity } from 'src/db/blacklistedCollections';

@Injectable()
export class BlacklistedCollectionsService {
  constructor(
    private readonly persistenceService: PersistenceService,
    private readonly logger: Logger,
    private readonly blacklistedCollectionsCachingService: BlacklistedCollectionsCachingService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
  ) {}

  async isBlacklistedCollection(collection: string): Promise<boolean> {
    const blacklistedCollectionsIds = await this.getBlacklistedCollectionIds();
    return blacklistedCollectionsIds.includes(collection);
  }

  async getBlacklistedCollectionIds(): Promise<string[]> {
    const [blacklistedCollections] = await this.getBlacklistedCollectionEntitiesAndCount();
    return blacklistedCollections.map((c) => c.identifier);
  }

  async getBlacklistedCollectionEntitiesAndCount(): Promise<[BlacklistedCollectionEntity[], number]> {
    try {
      const getBlacklistedCollections = () => this.persistenceService.getBlacklistedCollections();
      return await this.blacklistedCollectionsCachingService.getOrSetBlacklistedCollections(getBlacklistedCollections);
    } catch (err) {
      this.logger.error('An error occurred while loading blacklisted collections entities and count.', {
        path: `${BlacklistedCollectionsService.name}.${this.getBlacklistedCollectionEntitiesAndCount.name}`,
        exception: err,
      });
    }
  }

  async addBlacklistedCollection(collection: string): Promise<boolean> {
    const isAdded = await this.persistenceService.addBlacklistedCollection(collection);
    if (isAdded) {
      await this.triggerBlacklistedCollectionsCacheInvalidation();
    }
    return isAdded;
  }

  async removeBlacklistedCollection(collection: string): Promise<boolean> {
    const isRemoved = await this.persistenceService.removeBlacklistedCollection(collection);
    if (isRemoved) {
      await this.triggerBlacklistedCollectionsCacheInvalidation();
    }
    return isRemoved;
  }

  async triggerBlacklistedCollectionsCacheInvalidation(): Promise<void> {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        type: CacheEventTypeEnum.BlacklistedCollections,
      }),
    );
  }
}
