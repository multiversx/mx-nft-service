import { Injectable } from '@nestjs/common';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { ScamInfoTypeEnum } from '../assets/models';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamService } from './nft-scam.service';

@Injectable()
export class CollectionScamService {
  constructor(
    private readonly documentDbService: DocumentDbService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
    private readonly nftScamElasticService: NftScamElasticService,
    private readonly nftScamService: NftScamService,
  ) {}

  async manuallySetCollectionScamInfo(collection: string): Promise<boolean> {
    await Promise.all([
      this.documentDbService.saveOrUpdateCollectionScamInfo(collection, 'manual', ScamInfo.scam()),
      this.nftScamElasticService.setNftScamInfoManuallyInElastic(collection, ScamInfo.scam()),
      await this.nftScamService.markAllNftsForCollection(collection, 'manual', ScamInfo.scam()),
    ]);

    await this.triggerCacheInvalidation(collection);
    return true;
  }

  async manuallyClearCollectionScamInfo(collection: string): Promise<boolean> {
    await Promise.all([
      this.documentDbService.saveOrUpdateCollectionScamInfo(collection, 'manual', ScamInfo.none()),
      this.nftScamElasticService.setCollectionScamInfoManuallyInElastic(collection, ScamInfo.none()),
      await this.nftScamService.markAllNftsForCollection(collection, 'manual', ScamInfo.none()),
    ]);
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
