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
    const auction = marketplaceReindexState.auctionMap.get(input.auctionId);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    if (!auction) {
      return;
    }

    marketplaceReindexState.updateAuctionStatus(auction, input.blockHash, AuctionStatusEnum.Ended, input.timestamp);

    const winnerOrderId = marketplaceReindexState.setAuctionOrderWinnerStatusAndReturnId(auction, OrderStatusEnum.Bought, modifiedDate);

    if (winnerOrderId !== -1) {
      marketplaceReindexState.setInactiveOrdersForAuction(auction, modifiedDate, winnerOrderId);
    } else if (input.currentBid !== '0') {
      const order = marketplaceReindexState.createOrder(auction, input, OrderStatusEnum.Bought, paymentToken);
      if (auction.orders) {
        marketplaceReindexState.auctionMap.get(auction.marketplaceAuctionId).orders.push(order);
      } else {
        marketplaceReindexState.auctionMap.get(auction.marketplaceAuctionId).orders = [order];
      }
    }
  }
}
