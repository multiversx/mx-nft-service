import { Injectable } from '@nestjs/common';
import { OrderEntity } from 'src/db/orders';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { DateUtils } from 'src/utils/date-utils';
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

    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    marketplaceReindexState.setInactiveOrdersForAuction(marketplaceReindexState.auctions[auctionIndex].id, modifiedDate);

    const order = marketplaceReindexState.createOrder(auctionIndex, input, OrderStatusEnum.Bought, paymentToken, paymentNonce);
    marketplaceReindexState.orders.push(order);

    const totalBought = this.getTotalBoughtTokensForAuction(
      marketplaceReindexState.auctions[auctionIndex].id,
      marketplaceReindexState.orders,
    );

    if (marketplaceReindexState.auctions[auctionIndex].nrAuctionedTokens === totalBought) {
      marketplaceReindexState.auctions[auctionIndex].status = AuctionStatusEnum.Ended;
      marketplaceReindexState.auctions[auctionIndex].modifiedDate = modifiedDate;
      marketplaceReindexState.auctions[auctionIndex].blockHash =
        marketplaceReindexState.auctions[auctionIndex].blockHash ?? input.blockHash;
    }
  }

  private getTotalBoughtTokensForAuction(auctionId: number, orders: OrderEntity[]): number {
    let totalBought = 0;
    orders
      .filter((o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Bought)
      .forEach((o) => {
        totalBought += parseInt(o.boughtTokensNo) ? parseInt(o.boughtTokensNo) : 1;
      });
    return totalBought;
  }
}
