import { Injectable, Logger } from '@nestjs/common';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum, MarketplaceEventEnum } from 'src/modules/assets/models';
import { StartAuctionEventHandler } from './handlers-reindex/startAuction-event.handler';
import { EndAuctionEventHandler } from './handlers-reindex/endAuction-event.handler';
import { BidEventHandler } from './handlers-reindex/bid-event.handler';
import { BuyEventHandler } from './handlers-reindex/buy-event.handler';
import { WithdrawAuctionEventHandler } from './handlers-reindex/withdrawAuction-event.handler';
import { UpdatePriceEventHandler } from './handlers-reindex/updatePrice-event.handler';
import { SendOfferEventHandler } from './handlers-reindex/sendOffer-event.handler';
import { AcceptGlobalOfferEventHandler } from './handlers-reindex/acceptGlobalOffer-event.handler';
import { SwapUpdateEventHandler } from './handlers-reindex/swapUpdate-event.handler';
import { SlackReportService } from 'src/common/services/mx-communication/slack-report.service';
import { AcceptOfferEventHandler } from './handlers-reindex/acceptOffer-event.handler';
import { WithdrawOfferEventHandler } from './handlers-reindex/withdrawOffer-event.handler';
import { UpdateListingEventHandler } from './handlers-reindex/updateListing-event.handler';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class MarketplaceEventsProcessingService {
  private readonly logger = new Logger(MarketplaceEventsProcessingService.name);

  constructor(
    private startAuctionEventHandler: StartAuctionEventHandler,
    private endAuctionEventHandler: EndAuctionEventHandler,
    private withdrawAuctionEventHandler: WithdrawAuctionEventHandler,
    private bidEventHandler: BidEventHandler,
    private buyEventHandler: BuyEventHandler,
    private updatePriceEventHandler: UpdatePriceEventHandler,
    private acceptOfferEventHandler: AcceptOfferEventHandler,
    private acceptGlobalOfferEventHandler: AcceptGlobalOfferEventHandler,
    private swapUpdateEventHandler: SwapUpdateEventHandler,
    private updateListingEventHandler: UpdateListingEventHandler,
    private readonly slackReportService: SlackReportService,
    private sendOfferEventHandler: SendOfferEventHandler,
    private withdrawOfferEventHandler: WithdrawOfferEventHandler,
    private marketplaceService: MarketplacesService,
  ) { }

  public async handleNftAuctionEvents(auctionEvents: EventLog[]) {
    for (let event of auctionEvents) {
      const marketplace = await this.marketplaceService.getMarketplaceByAddress(event.address);
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
        case KroganSwapAuctionEventEnum.Bid:
          await this.bidEventHandler.handle(event, marketplace);

          break;
        case AuctionEventEnum.BuySftEvent:
        case ExternalAuctionEventEnum.Buy:
        case ExternalAuctionEventEnum.BulkBuy:
        case ExternalAuctionEventEnum.BuyFor:
        case ExternalAuctionEventEnum.BuyNft:
        case KroganSwapAuctionEventEnum.Purchase:
          const eventName = Buffer.from(event.topics[0], 'base64').toString();
          if (eventName === ExternalAuctionEventEnum.UpdateOffer || eventName === KroganSwapAuctionEventEnum.UpdateListing) {
            this.logger.log(`${eventName} event detected  for marketplace ${event.address}, ignore it for the moment`);
            continue;
          }
          await this.buyEventHandler.handle(event, marketplace);
          break;
        case AuctionEventEnum.WithdrawEvent:
        case KroganSwapAuctionEventEnum.WithdrawSwap:
        case ExternalAuctionEventEnum.ClaimBackNft:
        case ExternalAuctionEventEnum.ReturnListing:
          if (Buffer.from(event.topics[0], 'base64').toString() === ExternalAuctionEventEnum.UpdateOffer) {
            this.logger.log(
              `${event.topics[0]} event detected for marketplace ${event.address}, ignore it for the moment`,
            );
            continue;
          }
          await this.withdrawAuctionEventHandler.handle(event, marketplace);
          break;
        case AuctionEventEnum.EndAuctionEvent:
          await this.endAuctionEventHandler.handle(event, marketplace);
          break;
        case AuctionEventEnum.AuctionTokenEvent:
        case ExternalAuctionEventEnum.Listing:
        case ExternalAuctionEventEnum.ListNftOnMarketplace:
        case KroganSwapAuctionEventEnum.NftSwap:
          await this.startAuctionEventHandler.handle(event, marketplace);
          break;
        case ExternalAuctionEventEnum.ChangePrice:
        case ExternalAuctionEventEnum.UpdatePrice:
          await this.updatePriceEventHandler.handle(event, marketplace);
          break;
        case ExternalAuctionEventEnum.UpdateListing: {
          await this.updateListingEventHandler.handle(event, marketplace);
          break;
        }
        case ExternalAuctionEventEnum.AcceptOffer:
        case ExternalAuctionEventEnum.AcceptOfferFromAuction:
          const acceptOfferEventName = Buffer.from(event.topics[0], 'hex').toString();
          if (acceptOfferEventName === ExternalAuctionEventEnum.UserDeposit) {
            continue;
          }
          if (acceptOfferEventName === ExternalAuctionEventEnum.EndTokenEvent) {
            await this.withdrawAuctionEventHandler.handle(event, marketplace);
          } else {
            await this.acceptOfferEventHandler.handle(event, marketplace);
          }

          break;
        case AuctionEventEnum.WithdrawAuctionAndAcceptOffer:
          if (Buffer.from(event.topics[0], 'hex').toString() === AuctionEventEnum.Accept_offer_token_event) {
            await this.acceptOfferEventHandler.handle(event, marketplace);
          } else {
            await this.withdrawAuctionEventHandler.handle(event, marketplace);
          }
          break;
        case ExternalAuctionEventEnum.AcceptGlobalOffer:
          await this.acceptGlobalOfferEventHandler.handle(event, marketplace);
          break;
        case AuctionEventEnum.SendOffer:
          await this.sendOfferEventHandler.handle(event, marketplace);
          break;
        case AuctionEventEnum.WithdrawOffer:
          await this.withdrawOfferEventHandler.handle(event, marketplace);
          break;
        case KroganSwapAuctionEventEnum.NftSwapUpdate:
        case KroganSwapAuctionEventEnum.NftSwapExtend:
          await this.swapUpdateEventHandler.handle(event, marketplace);
          break;
        case MarketplaceEventEnum.SCUpgrade: {
          await this.slackReportService.sendScUpgradeNotification(event.address);
        }
      }
    }
  }
}
