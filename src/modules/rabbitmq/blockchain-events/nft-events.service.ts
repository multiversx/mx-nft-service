import { MxApiService } from 'src/common';
import { Injectable } from '@nestjs/common';
import { NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../cache-invalidation/events/changed.event';
import { MintEvent } from '../entities/auction/mint.event';
import { TransferEvent } from '../entities/auction/transfer.event';
import { FeedEventsSenderService } from './feed-events.service';
import { BurnEvent } from '../entities/auction/burn.event';

@Injectable()
export class NftEventsService {
  constructor(
    private feedEventsSenderService: FeedEventsSenderService,
    private mxApiService: MxApiService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
  ) {}

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          const collection =
            await this.mxApiService.getCollectionByIdentifierForQuery(
              createTopics.collection,
              'fields=name,type',
            );
          if (
            collection?.type === NftTypeEnum.NonFungibleESDT ||
            collection?.type === NftTypeEnum.SemiFungibleESDT
          ) {
            await this.feedEventsSenderService.sendMintEvent(
              identifier,
              mintEvent,
              createTopics,
              collection,
            );
            this.triggerCacheInvalidation(
              createTopics.collection,
              CacheEventTypeEnum.Mint,
            );
          }
          break;

        case NftEventEnum.ESDTNFTTransfer:
          const transferEvent = new TransferEvent(event);
          const transferTopics = transferEvent.getTopics();
          const collectionInfo =
            await this.mxApiService.getCollectionByIdentifierForQuery(
              transferTopics.collection,
              'fields=name,type',
            );
          if (
            collectionInfo?.type === NftTypeEnum.NonFungibleESDT ||
            collectionInfo?.type === NftTypeEnum.SemiFungibleESDT
          ) {
            await this.triggerCacheInvalidation(
              `${transferTopics.collection}-${transferTopics.nonce}`,
              CacheEventTypeEnum.OwnerChanged,
            );
          }
          break;

        case NftEventEnum.ESDTNFTBurn:
          const burnEvent = new BurnEvent(event);
          const burnTopics = burnEvent.getTopics();
          await new Promise((resolve) => setTimeout(resolve, 500));
          const burnCollection =
            await this.mxApiService.getCollectionByIdentifierForQuery(
              burnTopics.collection,
              'fields=name,type',
            );
          if (
            burnCollection?.type === NftTypeEnum.NonFungibleESDT ||
            burnCollection?.type === NftTypeEnum.SemiFungibleESDT
          ) {
            await this.triggerCacheInvalidation(
              `${burnTopics.collection}-${burnTopics.nonce}`,
              CacheEventTypeEnum.AssetRefresh,
            );
          }
          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new TransferEvent(event);
          const multiTransferTopics = multiTransferEvent.getTopics();
          const collectionDetails =
            await this.mxApiService.getCollectionByIdentifierForQuery(
              multiTransferTopics.collection,
              'fields=name,type',
            );
          if (
            collectionDetails?.type === NftTypeEnum.NonFungibleESDT ||
            collectionDetails?.type === NftTypeEnum.SemiFungibleESDT
          ) {
            this.triggerCacheInvalidation(
              `${multiTransferTopics.collection}-${multiTransferTopics.nonce}`,
              CacheEventTypeEnum.OwnerChanged,
            );
          }
          break;
      }
    }
  }

  private async triggerCacheInvalidation(
    id: string,
    eventType: CacheEventTypeEnum,
  ) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: id,
        type: eventType,
      }),
    );
  }
}
