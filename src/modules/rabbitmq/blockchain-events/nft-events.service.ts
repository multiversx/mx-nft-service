import { ElrondApiService } from 'src/common';
import { Injectable, Logger } from '@nestjs/common';
import {
  AuctionEventEnum,
  ExternalAuctionEventEnum,
  NftEventEnum,
  NftTypeEnum,
} from 'src/modules/assets/models';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../cache-invalidation/events/changed.event';
import { MintEvent } from '../entities/auction/mint.event';
import { TransferEvent } from '../entities/auction/transfer.event';
import { FeedEventsSenderService } from './feed-events.service';
import { StartAuctionEventHandler } from './handlers/startAuction-event.handler';
import { EndAuctionEventHandler } from './handlers/endAuction-event.handler';
import { BidEventHandler } from './handlers/bid-event.handler';
import { BuyEventHandler } from './handlers/buy-event.handler';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { WithdrawAuctionEventHandler } from './handlers/withdrawAuction-event.handler';
import { ChangePriceEventHandler } from './handlers/changePrice-event.handler';
import { UpdatePriceEventHandler } from './handlers/updatePrice-event.handler';
import { AcceptOfferEventHandler } from './handlers/acceptOffer-event.handler';
import { AcceptGlobalOfferEventHandler } from './handlers/acceptGlobalOffer-event.handler';

@Injectable()
export class NftEventsService {
  private readonly logger = new Logger(StartAuctionEventHandler.name);

  constructor(
    private startAuctionEventHandler: StartAuctionEventHandler,
    private endAuctionEventHandler: EndAuctionEventHandler,
    private withdrawAuctionEventHandler: WithdrawAuctionEventHandler,
    private bidEventHandler: BidEventHandler,
    private buyEventHandler: BuyEventHandler,
    private changePriceEventHandler: ChangePriceEventHandler,
    private updatePriceEventHandler: UpdatePriceEventHandler,
    private acceptOfferEventHandler: AcceptOfferEventHandler,
    private acceptGlobalOfferEventHandler: AcceptGlobalOfferEventHandler,
    private feedEventsSenderService: FeedEventsSenderService,
    private elrondApi: ElrondApiService,
    private readonly cacheEventsPublisherService: CacheEventsPublisherService,
  ) {}

  public async handleNftAuctionEvents(auctionEvents: any[], hash: string) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          await this.bidEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.Internal,
          );

          break;
        case AuctionEventEnum.BuySftEvent:
        case ExternalAuctionEventEnum.Buy:
        case ExternalAuctionEventEnum.BulkBuy:
          if (
            Buffer.from(event.topics[0], 'base64').toString() ===
            ExternalAuctionEventEnum.UpdateOffer
          ) {
            this.logger.log(
              `Update Offer event detected for hash '${hash}' at buy external marketplace, ignore it for the moment`,
            );
            return;
          }
          await this.buyEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.Internal,
          );
          break;
        case AuctionEventEnum.WithdrawEvent:
          if (
            Buffer.from(event.topics[0], 'base64').toString() ===
            ExternalAuctionEventEnum.UpdateOffer
          ) {
            this.logger.log(
              `Update Offer event detected for hash '${hash}' at withdraw marketplace, ignore it for the moment`,
            );
            return;
          }
          await this.withdrawAuctionEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.Internal,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          await this.endAuctionEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.Internal,
          );
          break;
        case AuctionEventEnum.AuctionTokenEvent:
        case ExternalAuctionEventEnum.Listing:
          await this.startAuctionEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.Internal,
          );
          break;

        case ExternalAuctionEventEnum.ChangePrice:
          await this.changePriceEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.External,
          );
          break;
        case ExternalAuctionEventEnum.UpdatePrice:
          await this.updatePriceEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.External,
          );
          break;

        case ExternalAuctionEventEnum.AcceptOffer:
          await this.acceptOfferEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.External,
          );
          break;
        case ExternalAuctionEventEnum.AcceptGlobalOffer:
          await this.acceptGlobalOfferEventHandler.handle(
            event,
            hash,
            MarketplaceTypeEnum.External,
          );
          break;
      }
    }
  }

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
