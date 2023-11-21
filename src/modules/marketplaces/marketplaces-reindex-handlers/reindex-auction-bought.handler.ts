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
    const auction =
      marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
        ? marketplaceReindexState.auctionMap.get(input.auctionId)
        : marketplaceReindexState.auctionMap.get(input.auctionId); //de scris

    if (!auction) {
      return;
    }

    const order = marketplaceReindexState.createOrder(auction, input, OrderStatusEnum.Bought, paymentToken, paymentNonce);

    if (auction.nrAuctionedTokens > 1) {
      const totalBought = this.getTotalBoughtTokensForAuction(auction.orders);

      if (auction.nrAuctionedTokens === totalBought) {
        marketplaceReindexState.updateAuctionStatus(auction, input.blockHash, AuctionStatusEnum.Ended, input.timestamp);
      }
    } else {
      marketplaceReindexState.updateAuctionStatus(auction, input.blockHash, AuctionStatusEnum.Ended, input.timestamp);
    }
    marketplaceReindexState.updateOrderListForAuction(auction, order);
  }

  private getTotalBoughtTokensForAuction(orders: OrderEntity[]): number {
    let totalBought = 0;
    if (orders?.length) {
      orders
        .filter((o) => o.status === OrderStatusEnum.Bought)
        .forEach((o) => {
          totalBought += parseInt(o.boughtTokensNo) ? parseInt(o.boughtTokensNo) : 1;
        });
      return totalBought;
    }
    return 0;
  }
}
