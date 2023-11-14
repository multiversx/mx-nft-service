import { Injectable } from '@nestjs/common';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionBidSummary } from '../models/marketplaces-reindex-events-summaries/AuctionBidSummary';

@Injectable()
export class ReindexAuctionBidHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: AuctionBidSummary, paymentToken: Token, paymentNonce: number): void {
    const auctionIndex = marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId);

    if (auctionIndex === -1) {
      return;
    }

    let order = marketplaceReindexState.createOrder(auctionIndex, input, OrderStatusEnum.Active, paymentToken, paymentNonce);
    if (order.priceAmount === marketplaceReindexState.auctions[auctionIndex].maxBid) {
      order.status = OrderStatusEnum.Bought;
      marketplaceReindexState.updateAuctionStatus(auctionIndex, input.blockHash, AuctionStatusEnum.Ended, input.timestamp);
    }

    marketplaceReindexState.updateOrderListForAuction(auctionIndex, order);
  }
}
