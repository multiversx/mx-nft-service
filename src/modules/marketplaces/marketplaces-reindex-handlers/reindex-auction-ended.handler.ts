import { Injectable } from '@nestjs/common';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionEndedSummary } from '../models/marketplaces-reindex-events-summaries/AuctionEndedSummary';

@Injectable()
export class ReindexAuctionEndedHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: AuctionEndedSummary, paymentToken: Token): void {
    const auctionIndex = marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (auctionIndex === -1) {
      return;
    }

    marketplaceReindexState.updateAuctionStatus(auctionIndex, input.blockHash, AuctionStatusEnum.Ended, input.timestamp);
    const selectedAuction = marketplaceReindexState.auctions[auctionIndex];

    const winnerOrderId = marketplaceReindexState.setAuctionOrderWinnerStatusAndReturnId(
      selectedAuction.id,
      OrderStatusEnum.Bought,
      modifiedDate,
    );

    if (winnerOrderId !== -1) {
      marketplaceReindexState.setInactiveOrdersForAuction(selectedAuction.id, modifiedDate, winnerOrderId);
    } else if (input.currentBid !== '0') {
      const order = marketplaceReindexState.createOrder(auctionIndex, input, OrderStatusEnum.Bought, paymentToken);
      if (marketplaceReindexState.auctions[auctionIndex].orders) {
        marketplaceReindexState.auctions[auctionIndex].orders.push(order);
      } else {
        marketplaceReindexState.auctions[auctionIndex].orders = [order];
      }
    }
  }
}
