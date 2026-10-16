import { MxApiService } from 'src/common';
import { Injectable, Logger } from '@nestjs/common';
import { NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../cache-invalidation/events/changed.event';
import { MintEvent } from '../entities/auction/mint.event';
import { MultiTransferEvent, TransferEvent } from '../entities/auction/transfer.event';
import { FeedEventsSenderService } from './feed-events.service';
import { BurnEvent } from '../entities/auction/burn.event';
import { UpdateAttributesEvent } from '../entities/auction/update-attributes.event';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

const SLOW_EVENT_THRESHOLD_MS = 1000;

@Injectable()
export class NftEventsService {
  private readonly logger = new Logger(NftEventsService.name);

  constructor(
    private feedEventsSenderService: FeedEventsSenderService,
    private mxApiService: MxApiService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
    private readonly redisCacheService: RedisCacheService,
  ) { }

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      const startTime = Date.now();
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          const collection = await this.mxApiService.getCollectionByIdentifierForQuery(createTopics.collection, 'fields=name,type');
          if (collection?.type === NftTypeEnum.NonFungibleESDT || collection?.type === NftTypeEnum.SemiFungibleESDT) {
            await this.feedEventsSenderService.sendMintEvent(identifier, mintEvent, createTopics, collection);
            this.triggerCacheInvalidation(createTopics.collection, CacheEventTypeEnum.Mint);
          }
          break;

        case NftEventEnum.ESDTNFTTransfer:
          const transferEvent = new TransferEvent(event);
          const transferTopics = transferEvent.getTopics();
          const collectionType = await this.getCollectionType(transferTopics.collection);
          if (collectionType === NftTypeEnum.NonFungibleESDT || collectionType === NftTypeEnum.SemiFungibleESDT) {
            await this.triggerCacheInvalidationWithOwner(
              `${transferTopics.collection}-${transferTopics.nonce}`,
              CacheEventTypeEnum.OwnerChanged,
              transferEvent.getAddress(),
              transferTopics.receiverAddress.toString(),
            );
          }
          break;

        case NftEventEnum.ESDTNFTBurn:
          const burnEvent = new BurnEvent(event);
          const burnTopics = burnEvent.getTopics();
          await new Promise((resolve) => setTimeout(resolve, 500));
          const burnCollectionType = await this.getCollectionType(burnTopics.collection);
          if (burnCollectionType === NftTypeEnum.NonFungibleESDT || burnCollectionType === NftTypeEnum.SemiFungibleESDT) {
            await this.triggerCacheInvalidation(`${burnTopics.collection}-${burnTopics.nonce}`, CacheEventTypeEnum.AssetRefresh);
          }
          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new MultiTransferEvent(event);
          multiTransferEvent.getAddress();
          const multiTransferTopics = multiTransferEvent.getTopics();
          for (const pair of multiTransferTopics.pairs) {
            if (pair.nonce !== '') {
              const pairCollectionType = await this.getCollectionType(pair.collection);
              if (pairCollectionType === NftTypeEnum.NonFungibleESDT || pairCollectionType === NftTypeEnum.SemiFungibleESDT) {
                this.triggerCacheInvalidationWithOwner(
                  `${pair.collection}-${pair.nonce}`,
                  CacheEventTypeEnum.OwnerChanged,
                  multiTransferEvent.getAddress(),
                  multiTransferTopics.receiverAddress.toString(),
                );
              }
            }
          }
          break;

        case NftEventEnum.ESDTModifyCreator:
        case NftEventEnum.ESDTMetaDataRecreate:
        case NftEventEnum.ESDTMetaDataUpdate:
        case NftEventEnum.ESDTNFTUpdateAttributes:
          const updateEvent = new UpdateAttributesEvent(event);
          const updateTopics = updateEvent.getTopics();
          const updateCollectionType = await this.getCollectionType(updateTopics.collection);
          if (updateCollectionType === NftTypeEnum.NonFungibleESDT || updateCollectionType === NftTypeEnum.SemiFungibleESDT) {
            await this.triggerCacheInvalidation(
              `${updateTopics.collection}-${updateTopics.nonce}`,
              CacheEventTypeEnum.AssetRefresh,
            );
          }
          break;

      }

      const duration = Date.now() - startTime;
      if (duration >= SLOW_EVENT_THRESHOLD_MS) {
        this.logger.warn(`Slow NFT event '${event.identifier}' ${duration}ms for hash '${hash}'`);
      }
    }
  }

  private async getCollectionType(collection: string): Promise<string> {
    return await this.redisCacheService.getOrSet<string>(
      generateCacheKeyFromParams(CacheInfo.CollectionTypes.key, collection),
      async () => (await this.mxApiService.getCollectionByIdentifierForQuery(collection, 'fields=type'))?.type,
      CacheInfo.CollectionTypes.ttl,
    );
  }

  private async triggerCacheInvalidation(id: string, eventType: CacheEventTypeEnum) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: id,
        type: eventType,
      }),
    );
  }

  private async triggerCacheInvalidationWithOwner(id: string, eventType: CacheEventTypeEnum, address: string, receiverAddress: string) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: id,
        type: eventType,
        address: address,
        extraInfo: { receiverAddress: receiverAddress },
      }),
    );
  }
}
