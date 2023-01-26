import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { MxExtrasApiService } from 'src/common/services/mx-communication/mx-extras-api.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../rabbitmq/cache-invalidation/events/changed.event';

@Injectable()
export class CollectionScamService {
  constructor(
    private mxExtrasApiService: MxExtrasApiService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
  ) {}

  async manuallySetCollectionScamInfo(collection: string): Promise<boolean> {
    //await this.mxExtrasApiService.setCollectionScam(collection);
    await this.triggerCacheInvalidation(collection);
    return true;
  }

  async manuallyClearCollectionScamInfo(collection: string): Promise<boolean> {
    //await this.mxExtrasApiService.clearCollectionScam(collection);
    await this.triggerCacheInvalidation(collection);
    return true;
  }

  private async triggerCacheInvalidation(collection: string): Promise<void> {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: collection,
        type: CacheEventTypeEnum.MarkCollection,
      }),
    );
  }
}
