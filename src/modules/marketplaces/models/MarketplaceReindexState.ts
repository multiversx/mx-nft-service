import { ObjectType } from '@nestjs/graphql';
import BigNumber from 'bignumber.js';
import { AuctionEntity } from 'src/db/auctions';
import { OfferEntity } from 'src/db/offers';
import { OrderEntity } from 'src/db/orders';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { DateUtils } from 'src/utils/date-utils';
import { Marketplace } from './Marketplace.dto';

@ObjectType()
export class MarketplaceReindexState {
  marketplace: Marketplace;
  auctions: AuctionEntity[] = [];
  orders: OrderEntity[] = [];
  offers: OfferEntity[] = [];

  constructor(init?: Partial<MarketplaceReindexState>) {
    Object.assign(this, init);
  }

  getAuctionIndexByNonce(auctionId: number): number {
    return this.auctions.findIndex((a) => a.marketplaceAuctionId === auctionId);
  }

  getAuctionIndexByIdentifier(identifier: string): number {
    return this.auctions.findIndex(
      (a) =>
        a.identifier === identifier && a.status === AuctionStatusEnum.Running,
    );
  }

  getOfferIndexByNonce(offerId: number): number {
    return this.offers.findIndex((o) => o.marketplaceOfferId === offerId);
  }

  setAuctionOrderWinnerStatusAndReturnId(
    auctionId: number,
    status: OrderStatusEnum,
    modifiedDate?: Date,
  ): number {
    const bids = this.orders
      .filter(
        (o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Active,
      )
      .map((o) => new BigNumber(o.priceAmount));

    if (bids.length) {
      const maxBid = BigNumber.max(...bids);
      const winnerOrderIndex = this.orders.findIndex(
        (o) =>
          o.auctionId === auctionId &&
          o.status === OrderStatusEnum.Active &&
          o.priceAmount === maxBid.toString(),
      );
      this.orders[winnerOrderIndex].status = status;
      if (modifiedDate) {
        this.orders[winnerOrderIndex].modifiedDate = modifiedDate;
      }
      return this.orders[winnerOrderIndex].id;
    }
    return -1;
  }

  setInactiveOrdersForAuction(
    auctionId: number,
    modifiedDate: Date,
    exceptWinnerId?: number,
  ): void {
    this.orders
      .filter(
        (o) =>
          o.auctionId === auctionId &&
          o.status === OrderStatusEnum.Active &&
          o.id !== exceptWinnerId,
      )
      .map((o) => {
        o.status = OrderStatusEnum.Inactive;
        o.modifiedDate = modifiedDate;
      });
  }

  setStateItemsToExpiredIfOlderThanTimestamp(timestamp: number): void {
    this.setAuctionsAndOrdersToExpiredIfOlderThanTimestamp(timestamp);
    this.setOffersToExpiredIfOlderThanTimestamp(timestamp);
  }

  private setAuctionsAndOrdersToExpiredIfOlderThanTimestamp(
    timestamp: number,
  ): void {
    const runningAuctions = this.auctions.filter(
      (a) => a.status === AuctionStatusEnum.Running,
    );
    for (let i = 0; i < runningAuctions.length; i++) {
      if (
        runningAuctions[i].endDate > 0 &&
        runningAuctions[i].endDate < timestamp
      ) {
        runningAuctions[i].status = AuctionStatusEnum.Claimable;
        const winnerOrderId = this.setAuctionOrderWinnerStatusAndReturnId(
          runningAuctions[i].id,
          OrderStatusEnum.Active,
        );
        this.setInactiveOrdersForAuction(
          runningAuctions[i].id,
          DateUtils.getUtcDateFromTimestamp(runningAuctions[i].endDate),
          winnerOrderId,
        );
      }
    }
  }

  private setOffersToExpiredIfOlderThanTimestamp(timestamp: number): void {
    for (let i = 0; i < this.offers.length; i++) {
      if (
        this.offers[i].status === OfferStatusEnum.Active &&
        this.offers[i].endDate &&
        this.offers[i].endDate < timestamp
      ) {
        this.offers[i].status = OfferStatusEnum.Expired;
      }
    }
  }
}
