import { Injectable, Logger } from '@nestjs/common';
import {
  AuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
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
export class MarketplaceEventsService {
  private readonly logger = new Logger(MarketplaceEventsService.name);

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
  ) {}

  public async handleNftAuctionEvents(
    auctionEvents: any[],
    hash: string,
    marketplaceType: MarketplaceTypeEnum,
  ) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          await this.bidEventHandler.handle(event, hash, marketplaceType);

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
          await this.buyEventHandler.handle(event, hash, marketplaceType);
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
            marketplaceType,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          await this.endAuctionEventHandler.handle(
            event,
            hash,
            marketplaceType,
          );
          break;
        case AuctionEventEnum.AuctionTokenEvent:
        case ExternalAuctionEventEnum.Listing:
          await this.startAuctionEventHandler.handle(
            event,
            hash,
            marketplaceType,
          );
          break;

        case ExternalAuctionEventEnum.ChangePrice:
          await this.changePriceEventHandler.handle(
            event,
            hash,
            marketplaceType,
          );
          break;
        case ExternalAuctionEventEnum.UpdatePrice:
          await this.updatePriceEventHandler.handle(
            event,
            hash,
            marketplaceType,
          );
          break;

        case ExternalAuctionEventEnum.AcceptOffer:
          await this.acceptOfferEventHandler.handle(
            event,
            hash,
            marketplaceType,
          );
          break;
        case ExternalAuctionEventEnum.AcceptGlobalOffer:
          await this.acceptGlobalOfferEventHandler.handle(
            event,
            hash,
            marketplaceType,
          );
          break;
      }
    }
  }
}
