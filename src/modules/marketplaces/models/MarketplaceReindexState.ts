import { ObjectType } from '@nestjs/graphql';
import BigNumber from 'bignumber.js';
import { AuctionEntity } from 'src/db/auctions';
import { OfferEntity } from 'src/db/offers';
import { OrderEntity } from 'src/db/orders';
import { AuctionStatusEnum, AuctionTypeEnum } from 'src/modules/auctions/models';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OrderStatusEnum } from 'src/modules/orders/models';
import { Token } from 'src/modules/usdPrice/Token.model';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { Marketplace } from './Marketplace.dto';

@ObjectType()
export class MarketplaceReindexState {
  marketplace: Marketplace;
  isFullStateInMemory: boolean;
  listedCollections: string[] = [];
  auctions: AuctionEntity[] = [];
  orders: OrderEntity[] = [];
  offers: OfferEntity[] = [];

  constructor(init?: Partial<MarketplaceReindexState>) {
    Object.assign(this, init);
  }

  isCollectionListed(collection: string): boolean {
    return this.listedCollections.includes(collection);
  }

  getAuctionIndexByAuctionId(auctionId: number): number {
    return this.auctions.findIndex((a) => a.marketplaceAuctionId === auctionId);
  }

  getAuctionIndexByIdentifier(identifier: string): number {
    return this.auctions.findIndex((a) => a.identifier === identifier && a.status === AuctionStatusEnum.Running);
  }

  getOfferIndexByOfferId(offerId: number): number {
    return this.offers.findIndex((o) => o.marketplaceOfferId === offerId);
  }

  createOrder(auctionIndex: number, input: any, status: OrderStatusEnum, paymentToken: Token, paymentNonce?: number): OrderEntity {
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const price = input.price ?? input.currentBid;
    return new OrderEntity({
      id: this.orders.length,
      creationDate: modifiedDate,
      modifiedDate,
      auctionId: this.auctions[auctionIndex].id,
      ownerAddress: input.address,
      priceToken: paymentToken.identifier,
      priceNonce: paymentNonce ?? 0,
      priceAmount: price !== '0' ? price : this.auctions[auctionIndex].maxBid,
      priceAmountDenominated:
        price !== '0' ? BigNumberUtils.denominateAmount(price, paymentToken.decimals) : this.auctions[auctionIndex].maxBidDenominated,
      blockHash: input.blockHash ?? '',
      marketplaceKey: this.marketplace.key,
      boughtTokensNo: this.auctions[auctionIndex].type === AuctionTypeEnum.Nft ? null : input.itemsCount,
      status: status,
    });
  }

  setAuctionOrderWinnerStatusAndReturnId(auctionId: number, status: OrderStatusEnum, modifiedDate?: Date): number {
    const bids = this.orders
      .filter((o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Active)
      .map((o) => new BigNumber(o.priceAmount));

    if (bids.length) {
      const maxBid = BigNumber.max(...bids);
      const winnerOrderIndex = this.orders.findIndex(
        (o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Active && o.priceAmount === maxBid.toString(),
      );
      this.orders[winnerOrderIndex].status = status;
      if (modifiedDate) {
        this.orders[winnerOrderIndex].modifiedDate = modifiedDate;
      }
      return this.orders[winnerOrderIndex].id;
    }
    return -1;
  }

  setInactiveOrdersForAuction(auctionId: number, modifiedDate: Date, exceptWinnerId?: number): void {
    this.orders
      ?.filter((o) => o.auctionId === auctionId && o.status === OrderStatusEnum.Active && o.id !== exceptWinnerId)
      ?.map((o) => {
        o.status = OrderStatusEnum.Inactive;
        o.modifiedDate = modifiedDate;
      });
  }

  setStateItemsToExpiredIfOlderThanTimestamp(timestamp: number): void {
    this.setAuctionsAndOrdersToExpiredIfOlderThanTimestamp(timestamp);
    this.setOffersToExpiredIfOlderThanTimestamp(timestamp);
  }

  popInactiveItems(): [AuctionEntity[], OrderEntity[], OfferEntity[]] {
    const inactiveAuctionStatuses = [AuctionStatusEnum.Closed, AuctionStatusEnum.Ended];
    const inactiveOfferStatuses = [OfferStatusEnum.Accepted, OfferStatusEnum.Closed, OfferStatusEnum.Expired];

    let inactiveAuctions = [];
    let inactiveOrders = [];
    let inactiveOffers = [];

    for (let i = 0; i < this.auctions.length; i++) {
      if (inactiveAuctionStatuses.includes(this.auctions[i].status)) {
        inactiveAuctions.push(this.auctions[i]);
        delete this.auctions[i];
      }
    }
    this.auctions = this.auctions.filter((a) => a);

    for (let i = 0; i < this.orders.length; i++) {
      if (inactiveAuctions.findIndex((a) => a.id === this.orders[i].auctionId) !== -1) {
        inactiveOrders.push(this.orders[i]);
        delete this.orders[i];
      }
    }
    this.orders = this.orders.filter((o) => o);

    for (let i = 0; i < this.offers.length; i++) {
      if (inactiveOfferStatuses.includes(this.offers[i].status)) {
        inactiveOffers.push(this.offers[i]);
        delete this.offers[i];
      }
    }
    this.offers = this.offers.filter((o) => o);

    return [inactiveAuctions, inactiveOrders, inactiveOffers];
  }

  private setAuctionsAndOrdersToExpiredIfOlderThanTimestamp(timestamp: number): void {
    const runningAuctions = this.auctions?.filter((a) => a.status === AuctionStatusEnum.Running);
    for (let i = 0; i < runningAuctions.length; i++) {
      if (runningAuctions[i].endDate > 0 && runningAuctions[i].endDate < timestamp) {
        runningAuctions[i].status = AuctionStatusEnum.Claimable;
        const winnerOrderId = this.setAuctionOrderWinnerStatusAndReturnId(runningAuctions[i].id, OrderStatusEnum.Active);
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
      if (this.offers[i].status === OfferStatusEnum.Active && this.offers[i].endDate && this.offers[i].endDate < timestamp) {
        this.offers[i].status = OfferStatusEnum.Expired;
      }
    }
  }
}
