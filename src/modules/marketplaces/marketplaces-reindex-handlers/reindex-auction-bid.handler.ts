import { Injectable } from '@nestjs/common';
import { Token } from 'src/common/services/mx-communication/models/Token.model';
import { OrderEntity } from 'src/db/orders';
import {
  AuctionStatusEnum,
  AuctionTypeEnum,
} from 'src/modules/auctions/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { MarketplaceReindexState } from '../models/MarketplaceReindexState';
import { AuctionBidSummary } from '../models/marketplaces-reindex-events-summaries/AuctionBidSummary';

@Injectable()
export class ReindexAuctionBidHandler {
  constructor() {}

  handle(
    marketplaceReindexState: MarketplaceReindexState,
    input: AuctionBidSummary,
    paymentToken: Token,
    paymentNonce: number,
  ): void {
    const auctionIndex = marketplaceReindexState.getAuctionIndexByNonce(
      input.auctionId,
    );

    if (auctionIndex === -1) {
      return;
    }

    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const itemsCount = parseInt(input.itemsCount);

    marketplaceReindexState.setInactiveOrdersForAuction(
      marketplaceReindexState.auctions[auctionIndex].id,
      modifiedDate,
    );

    let order = new OrderEntity({
      id: marketplaceReindexState.orders.length,
      creationDate: modifiedDate,
      modifiedDate,
      auctionId: marketplaceReindexState.auctions[auctionIndex].id,
      status: OrderStatusEnum.Active,
      ownerAddress: input.address,
      priceToken: paymentToken.identifier,
      priceNonce: paymentNonce,
      priceAmount: input.price,
      priceAmountDenominated: BigNumberUtils.denominateAmount(
        input.price,
        paymentToken.decimals,
      ),
      blockHash: input.blockHash ?? '',
      marketplaceKey: marketplaceReindexState.marketplace.key,
      boughtTokensNo:
        marketplaceReindexState.auctions[auctionIndex].type ===
        AuctionTypeEnum.Nft
          ? null
          : itemsCount.toString(),
    });

    if (
      order.priceAmount ===
      marketplaceReindexState.auctions[auctionIndex].maxBid
    ) {
      order.status = OrderStatusEnum.Bought;
      marketplaceReindexState.auctions[auctionIndex].status =
        AuctionStatusEnum.Ended;
      marketplaceReindexState.auctions[auctionIndex].modifiedDate =
        modifiedDate;
    }

    marketplaceReindexState.orders.push(order);
  }
}
