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
  auctionMap = new Map<number, AuctionEntity>();
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

  getOfferIndexByOfferId(offerId: number): number {
    return this.offers.findIndex((o) => o.marketplaceOfferId === offerId);
  }

  createOrder(auction: AuctionEntity, input: any, status: OrderStatusEnum, paymentToken: Token, paymentNonce?: number): OrderEntity {
    const modifiedDate = DateUtils.getUtcDateFromTimestamp(input.timestamp);
    const price = input.price ?? input.currentBid;
    return new OrderEntity({
      creationDate: modifiedDate,
      modifiedDate,
      ownerAddress: input.address,
      priceToken: paymentToken.identifier,
      priceNonce: paymentNonce ?? 0,
      priceAmount: new BigNumber(price !== '0' ? price : auction.maxBid).toFixed(),
      priceAmountDenominated: price !== '0' ? BigNumberUtils.denominateAmount(price, paymentToken.decimals) : auction.maxBidDenominated,
      blockHash: input.blockHash ?? '',
      marketplaceKey: this.marketplace.key,
      boughtTokensNo: auction.type === AuctionTypeEnum.Nft ? null : input.itemsCount,
      status: status,
    });
  }

  setAuctionOrderWinnerStatusAndReturnId(auction: AuctionEntity, status: OrderStatusEnum, modifiedDate?: Date): number {
    if (!auction) {
      return -1;
    }

    const activeOrders = auction.orders?.filter((o) => o.status === OrderStatusEnum.Active);
    if (!activeOrders?.length) {
      return -1;
    }

    const maxBid = BigNumber.max(...activeOrders.map((o) => new BigNumber(o.priceAmount)));
    const winnerOrder = activeOrders.find((o) => new BigNumber(o.priceAmount).isEqualTo(maxBid));
    if (!winnerOrder) {
      return -1;
    }

    winnerOrder.status = status;
    if (modifiedDate) {
      winnerOrder.modifiedDate = modifiedDate;
    }

    return winnerOrder.id;
  }
  setInactiveOrdersForAuction(auction: AuctionEntity, modifiedDate: Date, exceptWinnerId?: number): void {
    if (auction && auction.orders) {
      for (const order of auction.orders) {
        if (order.status === OrderStatusEnum.Active && order.id !== exceptWinnerId) {
          order.status = OrderStatusEnum.Inactive;
          order.modifiedDate = modifiedDate;
        }
      }
    }
  }

  setStateItemsToExpiredIfOlderThanTimestamp(timestamp: number): void {
    this.setOffersToExpiredIfOlderThanTimestamp(timestamp);
  }

  popAllItems(): [AuctionEntity[], OfferEntity[]] {
    const inactiveAuctions = [...this.auctionMap.values()];
    const inactiveOffers = this.offers;
    this.offers = [];
    return [inactiveAuctions, inactiveOffers];
  }

  public updateOrderListForAuction(auction: AuctionEntity, order: OrderEntity) {
    const existingOrders = auction.orders || [];

    auction.orders = [...existingOrders.map((existingOrder) => ({ ...existingOrder, status: OrderStatusEnum.Inactive })), order];
  }

  public updateAuctionStatus(auction: AuctionEntity, blockHash: string, status: AuctionStatusEnum, timestamp: number): void {
    auction.status = status;
    auction.blockHash = auction.blockHash ?? blockHash;
    auction.modifiedDate = DateUtils.getUtcDateFromTimestamp(timestamp);
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

  private setOffersToExpiredIfOlderThanTimestamp(timestamp: number): void {
    for (let i = 0; i < this.offers.length; i++) {
      if (this.offers[i].status === OfferStatusEnum.Active && this.offers[i].endDate && this.offers[i].endDate < timestamp) {
        this.offers[i].status = OfferStatusEnum.Expired;
      }
    }
  }
}
