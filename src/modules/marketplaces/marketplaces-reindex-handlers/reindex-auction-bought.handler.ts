import { Injectable } from '@nestjs/common';
import { Token } from 'src/common/services/mx-communication/models/Token.model';
import { OrderEntity } from 'src/db/orders';
import {
  AuctionStatusEnum,
  AuctionTypeEnum,
} from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionBuySummary } from '../models/marketplaces-reindex-events-summaries/AuctionBuySummary';

@Injectable()
export class ReindexAuctionBoughtHandler {
  constructor() {}

  handle(
    marketplaceReindexState: MarketplaceReindexState,
    input: AuctionBuySummary,
    paymentToken: Token,
    paymentNonce: number,
  ): void {
    const auctionIndex =
      marketplaceReindexState.marketplace.key !== ELRONDNFTSWAP_KEY
        ? marketplaceReindexState.getAuctionIndexByNonce(input.auctionId)
        : marketplaceReindexState.getAuctionIndexByIdentifier(input.identifier);

    if (auctionIndex === -1) {
      return;
    }

    const itemsCount = parseInt(input.itemsCount);
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);

    marketplaceReindexState.setInactiveOrdersForAuction(
      marketplaceReindexState.auctions[auctionIndex].id,
      modifiedDate,
    );

    const order = new OrderEntity({
      id: marketplaceReindexState.orders.length,
      creationDate: modifiedDate,
      modifiedDate,
      auctionId: marketplaceReindexState.auctions[auctionIndex].id,
      ownerAddress: input.address,
      priceToken: paymentToken.identifier,
      priceNonce: paymentNonce,
      priceAmount:
        input.price !== '0'
          ? input.price
          : marketplaceReindexState.auctions[auctionIndex].maxBid,
      priceAmountDenominated:
        input.price !== '0'
          ? BigNumberUtils.denominateAmount(input.price, paymentToken.decimals)
          : marketplaceReindexState.auctions[auctionIndex].maxBidDenominated,
      blockHash: input.blockHash ?? '',
      marketplaceKey: marketplaceReindexState.marketplace.key,
      boughtTokensNo:
        marketplaceReindexState.auctions[auctionIndex].type ===
        AuctionTypeEnum.Nft
          ? null
          : itemsCount.toString(),
      status: OrderStatusEnum.Bought,
    });
    marketplaceReindexState.orders.push(order);

    const totalBought = this.getTotalBoughtTokensForAuction(
      marketplaceReindexState.auctions[auctionIndex].id,
      marketplaceReindexState.orders,
    );

    if (
      marketplaceReindexState.auctions[auctionIndex].nrAuctionedTokens ===
      totalBought
    ) {
      marketplaceReindexState.auctions[auctionIndex].status =
        AuctionStatusEnum.Ended;
      marketplaceReindexState.auctions[auctionIndex].modifiedDate =
        modifiedDate;
      marketplaceReindexState.auctions[auctionIndex].blockHash =
        marketplaceReindexState.auctions[auctionIndex].blockHash ??
        input.blockHash;
    }
  }

  private getTotalBoughtTokensForAuction(
    auctionId: number,
    orders: OrderEntity[],
  ): number {
    let totalBought = 0;
    orders
      .filter(
        (o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Bought,
      )
      .forEach((o) => {
        totalBought += parseInt(o.boughtTokensNo)
          ? parseInt(o.boughtTokensNo)
          : 1;
      });
    return totalBought;
  }
}
