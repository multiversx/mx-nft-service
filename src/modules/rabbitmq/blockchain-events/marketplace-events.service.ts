import { Injectable, Logger } from '@nestjs/common';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum, MarketplaceEventEnum } from 'src/modules/assets/models';
import { StartAuctionEventHandler } from './handlers/startAuction-event.handler';
import { EndAuctionEventHandler } from './handlers/endAuction-event.handler';
import { BidEventHandler } from './handlers/bid-event.handler';
import { BuyEventHandler } from './handlers/buy-event.handler';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { WithdrawAuctionEventHandler } from './handlers/withdrawAuction-event.handler';
import { UpdatePriceEventHandler } from './handlers/updatePrice-event.handler';
import { SendOfferEventHandler } from './handlers/sendOffer-event.handler';
import { AcceptGlobalOfferEventHandler } from './handlers/acceptGlobalOffer-event.handler';
import { SwapUpdateEventHandler } from './handlers/swapUpdate-event.handler';
import { SlackReportService } from 'src/common/services/mx-communication/slack-report.service';
import { AcceptOfferEventHandler } from './handlers/acceptOffer-event.handler';
import { WithdrawOfferEventHandler } from './handlers/withdrawOffer-event.handler';
import { UpdateListingEventHandler } from './handlers/updateListing-event.handler';

@Injectable()
export class MarketplaceEventsService {
  private readonly logger = new Logger(MarketplaceEventsService.name);

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
  ) {}

  public async handleNftAuctionEvents(auctionEvents: any[], hash: string, marketplaceType: MarketplaceTypeEnum) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
        case KroganSwapAuctionEventEnum.Bid:
          await this.bidEventHandler.handle(event, hash, marketplaceType);

          break;
        case AuctionEventEnum.BuySftEvent:
        case ExternalAuctionEventEnum.Buy:
        case ExternalAuctionEventEnum.BulkBuy:
        case ExternalAuctionEventEnum.BuyFor:
        case ExternalAuctionEventEnum.BuyNft:
        case KroganSwapAuctionEventEnum.Purchase:
          const eventName = Buffer.from(event.topics[0], 'base64').toString();
          if (eventName === ExternalAuctionEventEnum.UpdateOffer || eventName === KroganSwapAuctionEventEnum.UpdateListing) {
            this.logger.log(`${eventName} event detected for hash '${hash}' for marketplace ${event.address}, ignore it for the moment`);
            continue;
          }
          await this.buyEventHandler.handle(event, hash, marketplaceType);
          break;
        case AuctionEventEnum.WithdrawEvent:
        case KroganSwapAuctionEventEnum.WithdrawSwap:
        case ExternalAuctionEventEnum.ClaimBackNft:
        case ExternalAuctionEventEnum.ReturnListing:
          if (Buffer.from(event.topics[0], 'base64').toString() === ExternalAuctionEventEnum.UpdateOffer) {
            this.logger.log(
              `${event.topics[0]} event detected for hash '${hash}' for marketplace ${event.addreses}, ignore it for the moment`,
            );
            continue;
          }
          await this.withdrawAuctionEventHandler.handle(event, hash, marketplaceType);
          break;
        case AuctionEventEnum.EndAuctionEvent:
          await this.endAuctionEventHandler.handle(event, hash, marketplaceType);
          break;
        case AuctionEventEnum.AuctionTokenEvent:
        case ExternalAuctionEventEnum.Listing:
        case ExternalAuctionEventEnum.ListNftOnMarketplace:
        case KroganSwapAuctionEventEnum.NftSwap:
          await this.startAuctionEventHandler.handle(event, hash, marketplaceType);
          break;
        case ExternalAuctionEventEnum.ChangePrice:
        case ExternalAuctionEventEnum.UpdatePrice:
          await this.updatePriceEventHandler.handle(event, hash, marketplaceType);
          break;
        case ExternalAuctionEventEnum.UpdateListing: {
          await this.updateListingEventHandler.handle(event, hash, marketplaceType);
          break;
        }
        case ExternalAuctionEventEnum.AcceptOffer:
        case ExternalAuctionEventEnum.AcceptOfferFromAuction:
          const acceptOfferEventName = Buffer.from(event.topics[0], 'base64').toString();
          if (acceptOfferEventName === ExternalAuctionEventEnum.UserDeposit) {
            continue;
          }
          if (acceptOfferEventName === ExternalAuctionEventEnum.EndTokenEvent) {
            await this.withdrawAuctionEventHandler.handle(event, hash, marketplaceType);
          } else {
            await this.acceptOfferEventHandler.handle(event, hash, marketplaceType);
          }

          break;
        case AuctionEventEnum.WithdrawAuctionAndAcceptOffer:
          if (Buffer.from(event.topics[0], 'base64').toString() === AuctionEventEnum.Accept_offer_token_event) {
            await this.acceptOfferEventHandler.handle(event, hash, marketplaceType);
          } else {
            await this.withdrawAuctionEventHandler.handle(event, hash, marketplaceType);
          }
          break;
        case ExternalAuctionEventEnum.AcceptGlobalOffer:
          await this.acceptGlobalOfferEventHandler.handle(event, hash, marketplaceType);
          break;
        case AuctionEventEnum.SendOffer:
          await this.sendOfferEventHandler.handle(event, hash, marketplaceType);
          break;
        case AuctionEventEnum.WithdrawOffer:
          await this.withdrawOfferEventHandler.handle(event, hash, marketplaceType);
          break;
        case KroganSwapAuctionEventEnum.NftSwapUpdate:
        case KroganSwapAuctionEventEnum.NftSwapExtend:
          await this.swapUpdateEventHandler.handle(event, hash, marketplaceType);
          break;
        case MarketplaceEventEnum.SCUpgrade: {
          await this.slackReportService.sendScUpgradeNotification(event.address);
        }
      }
    }
  }
}
