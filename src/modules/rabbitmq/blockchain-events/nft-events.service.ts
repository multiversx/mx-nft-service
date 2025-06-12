import { MxApiService } from 'src/common';
import { Injectable } from '@nestjs/common';
import { NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../cache-invalidation/events/changed.event';
import { MintEvent } from '../entities/auction/mint.event';
import { MultiTransferEvent, TransferEvent } from '../entities/auction/transfer.event';
import { FeedEventsSenderService } from './feed-events.service';
import { BurnEvent } from '../entities/auction/burn.event';
import { UpdateAttributesEvent } from '../entities/auction/update-attributes.event';

@Injectable()
export class NftEventsService {
  constructor(
    private feedEventsSenderService: FeedEventsSenderService,
    private mxApiService: MxApiService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
  ) { }

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
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
          const collectionInfo = await this.mxApiService.getCollectionByIdentifierForQuery(transferTopics.collection, 'fields=name,type');
          if (collectionInfo?.type === NftTypeEnum.NonFungibleESDT || collectionInfo?.type === NftTypeEnum.SemiFungibleESDT) {
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
          const burnCollection = await this.mxApiService.getCollectionByIdentifierForQuery(burnTopics.collection, 'fields=name,type');
          if (burnCollection?.type === NftTypeEnum.NonFungibleESDT || burnCollection?.type === NftTypeEnum.SemiFungibleESDT) {
            await this.triggerCacheInvalidation(`${burnTopics.collection}-${burnTopics.nonce}`, CacheEventTypeEnum.AssetRefresh);
          }
          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new MultiTransferEvent(event);
          multiTransferEvent.getAddress();
          const multiTransferTopics = multiTransferEvent.getTopics();
          for (const pair of multiTransferTopics.pairs) {
            if (pair.nonce !== '') {
              const collectionDetails = await this.mxApiService.getCollectionByIdentifierForQuery(pair.collection, 'fields=name,type');
              if (collectionDetails?.type === NftTypeEnum.NonFungibleESDT || collectionDetails?.type === NftTypeEnum.SemiFungibleESDT) {
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
          const collectionUpdateInfo = await this.mxApiService.getCollectionByIdentifierForQuery(updateTopics.collection, 'fields=name,type');
          if (collectionUpdateInfo?.type === NftTypeEnum.NonFungibleESDT || collectionUpdateInfo?.type === NftTypeEnum.SemiFungibleESDT) {
            await this.triggerCacheInvalidation(
              `${updateTopics.collection}-${updateTopics.nonce}`,
              CacheEventTypeEnum.AssetRefresh,
            );
          }
          break;

      }
    }
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
