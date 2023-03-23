import { ObjectType } from '@nestjs/graphql';
import BigNumber from 'bignumber.js';
import { constants } from 'src/config';
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

  private auctionsTemporaryIdCounter = -1;
  private ordersTemporaryIdCounter = -1;
  private offersTemporaryIdCounter = -1;

  constructor(init?: Partial<MarketplaceReindexState>) {
    Object.assign(this, init);
  }

  getNewAuctionId(): number {
    return this.auctionsTemporaryIdCounter--;
  }

  getNewOrderId(): number {
    return this.ordersTemporaryIdCounter--;
  }

  getNewOfferId(): number {
    return this.offersTemporaryIdCounter--;
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
      id: this.getNewOrderId(),
      creationDate: modifiedDate,
      modifiedDate,
      auctionId: this.auctions[auctionIndex].id,
      ownerAddress: input.address,
      priceToken: paymentToken.identifier,
      priceNonce: paymentNonce ?? 0,
      priceAmount: new BigNumber(price !== '0' ? price : this.auctions[auctionIndex].maxBid).toFixed(),
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

  popAllItems(): [AuctionEntity[], OrderEntity[], OfferEntity[]] {
    const inactiveAuctions = this.auctions;
    const inactiveOrders = this.orders;
    const inactiveOffers = this.offers;
    this.auctions = [];
    this.orders = [];
    this.offers = [];
    return [inactiveAuctions, inactiveOrders, inactiveOffers];
  }

  popInactiveItems(): [AuctionEntity[], OrderEntity[], OfferEntity[]] {
    const inactiveAuctionStatuses = [AuctionStatusEnum.Closed, AuctionStatusEnum.Ended];
    const inactiveOfferStatuses = [OfferStatusEnum.Accepted, OfferStatusEnum.Closed, OfferStatusEnum.Expired];

    let inactiveAuctions = [];
    let inactiveOrders = [];
    let inactiveOffers = [];

    // if (this.marketplace.key === 'elrondapes')
    //   console.log(
    //     `state`,
    //     JSON.stringify(this.auctions),
    //     JSON.stringify(this.orders),
    //     JSON.stringify(this.offers),
    //   );
    // if (this.marketplace.key === 'elrondapes')
    //   console.log(
    //     `inactive`,
    //     JSON.stringify(inactiveAuctions),
    //     JSON.stringify(inactiveOrders),
    //     JSON.stringify(inactiveOffers),
    //   );

    if (this.marketplace.key === 'elrondapes') {
      console.log(
        `orders state`,
        this.orders.map((o) => o.id),
        this.orders.map((o) => o.auctionId),
      );
    }

    for (let i = 0; i < this.auctions.length; i++) {
      const isInactiveAuction = inactiveAuctionStatuses.includes(this.auctions[i].status);
      const isOldAuction =
        this.auctions.length > constants.marketplaceReindexDataMaxInMemoryItems &&
        i < this.auctions.length - constants.marketplaceReindexDataMaxInMemoryItems;

      if (isInactiveAuction || isOldAuction) {
        inactiveAuctions.push(this.auctions.splice(i--, 1)[0]);
      }
    }

    for (let i = 0; i < this.orders.length; i++) {
      const isInactiveOrOldOrder = inactiveAuctions.findIndex((a) => a.id === this.orders[i].auctionId) !== -1;

      if (isInactiveOrOldOrder) {
        inactiveOrders.push(this.orders.splice(i--, 1)[0]);
      }
    }

    for (let i = 0; i < this.offers.length; i++) {
      const isInactiveOffer = inactiveOfferStatuses.includes(this.offers[i].status);
      const isOldOffer =
        this.offers.length > constants.marketplaceReindexDataMaxInMemoryItems &&
        i < this.offers.length - constants.marketplaceReindexDataMaxInMemoryItems;

      if (isInactiveOffer || isOldOffer) {
        inactiveOffers.push(this.offers.splice(i--, 1)[0]);
      }
    }

    return [inactiveAuctions, inactiveOrders, inactiveOffers];
  }

  deleteAuctionIfDuplicates(marketplaceAuctionId: number) {
    if (this.isFullStateInMemory) {
      return;
    }

    let index;
    do {
      index = this.auctions.findIndex((a) => a.marketplaceAuctionId === marketplaceAuctionId);
      this.auctions.splice(index, 1);
    } while (index !== -1);
  }

  deleteOfferIfDuplicates(marketplaceOfferId: number) {
    if (this.isFullStateInMemory) {
      return;
    }

    let index;
    do {
      index = this.offers.findIndex((a) => a.marketplaceOfferId === marketplaceOfferId);
      this.offers.splice(index, 1);
    } while (index !== -1);
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
