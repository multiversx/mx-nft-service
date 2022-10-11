import { ElrondApiService } from 'src/common';
import { Injectable } from '@nestjs/common';
import { NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../cache-invalidation/events/changed.event';
import { MintEvent } from '../entities/auction/mint.event';
import { SendOfferEvent } from '../entities/auction/sendOffer.event';
import { TransferEvent } from '../entities/auction/transfer.event';
import { FeedEventsSenderService } from './feed-events.service';

@Injectable()
export class NftEventsService {
  constructor(
    private feedEventsSenderService: FeedEventsSenderService,
    private elrondApi: ElrondApiService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
  ) {}

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          this.triggerCacheInvalidation(
            createTopics.collection,
            CacheEventTypeEnum.Mint,
          );
          const collection =
            await this.elrondApi.getCollectionByIdentifierForQuery(
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
          }
          break;

        case NftEventEnum.ESDTNFTTransfer:
          const transferEvent = new TransferEvent(event);
          const transferTopics = transferEvent.getTopics();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await this.triggerCacheInvalidation(
            `${transferTopics.collection}-${transferTopics.nonce}`,
            CacheEventTypeEnum.OwnerChanged,
          );
          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new TransferEvent(event);
          const multiTransferTopics = multiTransferEvent.getTopics();
          this.triggerCacheInvalidation(
            `${multiTransferTopics.collection}-${multiTransferTopics.nonce}`,
            CacheEventTypeEnum.OwnerChanged,
          );

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
