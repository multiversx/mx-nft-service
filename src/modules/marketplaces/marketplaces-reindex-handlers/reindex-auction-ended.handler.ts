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

    marketplaceReindexState.auctions[auctionIndex].status = AuctionStatusEnum.Ended;
    marketplaceReindexState.auctions[auctionIndex].blockHash = marketplaceReindexState.auctions[auctionIndex].blockHash ?? input.blockHash;
    marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;

    const winnerOrderId = marketplaceReindexState.setAuctionOrderWinnerStatusAndReturnId(
      marketplaceReindexState.auctions[auctionIndex].id,
      OrderStatusEnum.Bought,
      modifiedDate,
    );

    if (winnerOrderId !== -1) {
      marketplaceReindexState.setInactiveOrdersForAuction(marketplaceReindexState.auctions[auctionIndex].id, modifiedDate, winnerOrderId);
    } else if (input.currentBid !== '0') {
      const order = marketplaceReindexState.createOrder(auctionIndex, input, OrderStatusEnum.Bought, paymentToken);
      marketplaceReindexState.orders.push(order);
    }
  }
}
