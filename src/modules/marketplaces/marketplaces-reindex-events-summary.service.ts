import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceEventsEntity } from 'src/db/marketplaces/marketplace-events.entity';
import { Marketplace } from './models';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from '../assets/models';
import { AuctionStartedSummary as AuctionStartedSummary } from './models/marketplaces-reindex-events-summaries/AuctionStartedSummary';
import { ReindexAuctionClosedSummary as AuctionClosedSummary } from './models/marketplaces-reindex-events-summaries/AuctionClosedSummary';
import { AuctionEndedSummary as AuctionEndedSummary } from './models/marketplaces-reindex-events-summaries/AuctionEndedSummary';
import { AuctionBuySummary as AuctionBuySummary } from './models/marketplaces-reindex-events-summaries/AuctionBuySummary';
import { AuctionBidSummary } from './models/marketplaces-reindex-events-summaries/AuctionBidSummary';
import { OfferCreatedSummary } from './models/marketplaces-reindex-events-summaries/OfferCreatedSummary';
import { OfferAcceptedSummary } from './models/marketplaces-reindex-events-summaries/OfferAcceptedSummary';
import { OfferClosedSummary } from './models/marketplaces-reindex-events-summaries/OfferClosedSummary';
import { AuctionUpdatedSummary } from './models/marketplaces-reindex-events-summaries/AuctionUpdatedSummary';
import { GlobalOfferAcceptedSummary } from './models/marketplaces-reindex-events-summaries/GloballyOfferAcceptedSummary';
import { AuctionPriceUpdatedSummary } from './models/marketplaces-reindex-events-summaries/AuctionPriceUpdated';
import { MarketplaceTransactionData } from './models/marketplaceEventAndTxData.dto';

@Injectable()
export class MarketplacesReindexEventsSummaryService {
  constructor(private readonly logger: Logger) {}
  getEventsSetSummaries(marketplace: Marketplace, eventsSet: MarketplaceEventsEntity[]): any[] {
    const [events, txData] = this.getEventsAndTxData(eventsSet);

    if (!events) {
      return;
    }

    return events.map((event) => {
      try {
        return this.getEventSummary(event, txData, marketplace);
      } catch (error) {
        this.logger.warn(`Error when getting event summary for ${txData.blockHash} ${event.timestamp}`);
      }
    });
  }

  private getEventsAndTxData(eventsSet: MarketplaceEventsEntity[]): [MarketplaceEventsEntity[], MarketplaceTransactionData] {
    const eventsOrderedByOrderAsc = eventsSet.sort((a, b) => {
      return a.eventOrder - b.eventOrder;
    });
    const tx = eventsSet[0].isTx ? eventsSet[0] : undefined;

    if (eventsOrderedByOrderAsc.length === 1 && tx) {
      return [undefined, undefined];
    }

    const eventsStartIdx = tx ? 1 : 0;

    return [eventsOrderedByOrderAsc.slice(eventsStartIdx), tx?.data?.txData];
  }

  private getEventSummary(event: MarketplaceEventsEntity, txData: MarketplaceTransactionData, marketplace: Marketplace): any {
    switch (event.getEventIdentifier()) {
      case AuctionEventEnum.AuctionTokenEvent:
      case ExternalAuctionEventEnum.Listing:
      case ExternalAuctionEventEnum.ListNftOnMarketplace:
      case KroganSwapAuctionEventEnum.NftSwap: {
        return AuctionStartedSummary.fromAuctionTokenEventAndTx(event, txData);
      }
      case AuctionEventEnum.WithdrawEvent:
      case ExternalAuctionEventEnum.ClaimBackNft:
      case KroganSwapAuctionEventEnum.WithdrawSwap:
      case ExternalAuctionEventEnum.ReturnListing: {
        return AuctionClosedSummary.fromWithdrawAuctionEventAndTx(event, txData);
      }
      case AuctionEventEnum.EndAuctionEvent: {
        return AuctionEndedSummary.fromEndAuctionEventAndTx(event, txData);
      }
      case AuctionEventEnum.BuySftEvent:
      case ExternalAuctionEventEnum.Buy:
      case ExternalAuctionEventEnum.BuyFor:
      case ExternalAuctionEventEnum.BuyNft:
      case KroganSwapAuctionEventEnum.Purchase:
      case ExternalAuctionEventEnum.BulkBuy: {
        return AuctionBuySummary.fromBuySftEventAndTx(event, txData, marketplace);
      }
      case AuctionEventEnum.BidEvent:
      case KroganSwapAuctionEventEnum.Bid: {
        return AuctionBidSummary.fromBidEventAndTx(event, txData, marketplace.key);
      }
      case AuctionEventEnum.SendOffer: {
        return OfferCreatedSummary.fromSendOfferEventAndTx(event, txData, marketplace);
      }
      case AuctionEventEnum.AcceptOffer:
      case ExternalAuctionEventEnum.AcceptOffer: {
        if (event.hasEventTopicIdentifier(ExternalAuctionEventEnum.EndTokenEvent)) {
          return AuctionClosedSummary.fromWithdrawAuctionEventAndTx(event, txData);
        }
        if (event.hasEventTopicIdentifier(ExternalAuctionEventEnum.UserDeposit)) {
          return;
        }
        return OfferAcceptedSummary.fromAcceptOfferEventAndTx(event, txData, marketplace);
      }
      case ExternalAuctionEventEnum.ChangePrice:
      case ExternalAuctionEventEnum.UpdatePrice: {
        return AuctionPriceUpdatedSummary.fromUpdatePriceEventAndTx(event, txData, marketplace);
      }
      case ExternalAuctionEventEnum.UpdateListing:
      case KroganSwapAuctionEventEnum.NftSwapUpdate:
      case KroganSwapAuctionEventEnum.NftSwapExtend: {
        return AuctionUpdatedSummary.fromUpdateListingEventAndTx(event, txData);
      }
      case ExternalAuctionEventEnum.AcceptGlobalOffer: {
        return GlobalOfferAcceptedSummary.fromAcceptGlobalOfferEventAndTx(event, txData);
      }
      case AuctionEventEnum.WithdrawOffer: {
        return OfferClosedSummary.fromWithdrawOfferEventAndTx(event, txData);
      }
      case AuctionEventEnum.WithdrawAuctionAndAcceptOffer: {
        if (event.hasEventTopicIdentifier(AuctionEventEnum.Accept_offer_token_event)) {
          return OfferAcceptedSummary.fromAcceptOfferEventAndTx(event, txData, marketplace);
        } else {
          return AuctionClosedSummary.fromWithdrawAuctionEventAndTx(event, txData);
        }
      }
      default: {
        throw new Error(`Unhandled marketplace event - ${event.data.eventData.identifier}`);
      }
    }
  }
}
