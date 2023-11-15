import { Injectable } from '@nestjs/common';
import { OrderEntity } from 'src/db/orders';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionBuySummary } from '../models/marketplaces-reindex-events-summaries/AuctionBuySummary';

@Injectable()
export class ReindexAuctionBoughtHandler {
  constructor() {}

  handle(marketplaceReindexState: MarketplaceReindexState, input: AuctionBuySummary, paymentToken: Token, paymentNonce: number): void {
    const auctionIndex =
      marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
        ? marketplaceReindexState.getAuctionIndexByAuctionId(input.auctionId)
        : marketplaceReindexState.getAuctionIndexByIdentifier(input.identifier);

    if (auctionIndex === -1) {
      return;
    }

    const order = marketplaceReindexState.createOrder(auctionIndex, input, OrderStatusEnum.Bought, paymentToken, paymentNonce);
    const auction = marketplaceReindexState.auctions[auctionIndex];

    if (auction.nrAuctionedTokens > 1) {
      const totalBought = this.getTotalBoughtTokensForAuction(auction.id, auction.orders);

      if (auction.nrAuctionedTokens === totalBought) {
        marketplaceReindexState.updateAuctionStatus(auctionIndex, input.blockHash, AuctionStatusEnum.Ended, input.timestamp);
      }
    }

    marketplaceReindexState.updateOrderListForAuction(auctionIndex, order);
  }

  private getTotalBoughtTokensForAuction(auctionId: number, orders: OrderEntity[]): number {
    let totalBought = 0;
    if (orders?.length) {
      orders
        .filter((o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Bought)
        .forEach((o) => {
          totalBought += parseInt(o.boughtTokensNo) ? parseInt(o.boughtTokensNo) : 1;
        });
      return totalBought;
    }
    return 0;
  }
}
