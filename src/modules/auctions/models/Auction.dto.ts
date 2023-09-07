import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AuctionWithBidsCount, AuctionWithStartBid } from 'src/db/auctions/auctionWithBidCount.dto';
import { Account } from 'src/modules/account-stats/models';
import { Asset, Price } from 'src/modules/assets/models';
import { Marketplace } from 'src/modules/marketplaces/models';
import { OrdersResponse } from 'src/modules/orders/models';
import { DateUtils } from 'src/utils/date-utils';
import { AuctionStatusEnum, AuctionTypeEnum } from '.';

@ObjectType()
export class Auction {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  marketplaceAuctionId: number;

  @Field(() => String)
  ownerAddress: string;

  @Field(() => Account, { nullable: true })
  owner: Account;

  @Field(() => AuctionStatusEnum)
  status: AuctionStatusEnum;

  @Field(() => AuctionTypeEnum)
  type: AuctionTypeEnum;

  @Field(() => String)
  collection: string;

  @Field(() => String)
  identifier: string;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int, { nullable: true })
  nrAuctionedTokens: number;

  @Field(() => Int, { nullable: true })
  availableTokens: number;

  @Field(() => Asset)
  asset: Asset;

  @Field(() => Price)
  minBid: Price;

  @Field(() => Price)
  minBidDiff: Price;

  @Field(() => Price)
  maxBid: Price;

  @Field(() => Int)
  startDate: number;

  @Field(() => Int)
  endDate: number;

  @Field(() => Int)
  creationDate: number;

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => Price, { nullable: true })
  topBid: Price;

  @Field(() => Account, { nullable: true })
  topBidder: Account;

  @Field(() => OrdersResponse, { nullable: true })
  orders: OrdersResponse;

  @Field(() => String)
  marketplaceKey: string;

  @Field(() => Marketplace, { nullable: true })
  marketplace: Marketplace;

  startBid: number;

  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: AuctionEntity | AuctionWithBidsCount | AuctionWithStartBid) {
    return !auction || Object.entries(auction).length === 0
      ? null
      : new Auction({
          id: auction.id,
          status: auction.status,
          type: auction.type,
          ownerAddress: auction.ownerAddress,
          collection: auction.collection,
          nonce: auction.nonce,
          identifier: auction.identifier,
          startDate: auction.startDate,
          endDate: auction.endDate > DateUtils.getCurrentTimestampPlusYears(1) ? 0 : auction.endDate,
          nrAuctionedTokens: auction.nrAuctionedTokens || 1,
          minBid: new Price({
            token: auction.paymentToken,
            nonce: 0,
            amount: auction.minBid,
            timestamp: DateUtils.getTimestamp(auction.creationDate),
          }),
          minBidDiff: new Price({
            token: auction.paymentToken,
            nonce: 0,
            amount: auction.minBidDiff,
            timestamp: DateUtils.getTimestamp(auction.creationDate),
          }),
          maxBid: new Price({
            token: auction.paymentToken,
            nonce: 0,
            amount: auction.maxBid,
            timestamp: DateUtils.getTimestamp(auction.creationDate),
          }),
          tags: auction.tags.split(',').filter((i) => i),
          creationDate: DateUtils.getTimestamp(auction.creationDate),
          marketplaceKey: auction.marketplaceKey,
          marketplaceAuctionId: auction.marketplaceAuctionId,
        });
  }

  static fromEntityWithStartBid(auction: AuctionWithStartBid) {
    return !auction || Object.entries(auction).length === 0
      ? null
      : new Auction({
          id: auction.id,
          status: auction.status,
          type: auction.type,
          ownerAddress: auction.ownerAddress,
          collection: auction.collection,
          nonce: auction.nonce,
          identifier: auction.identifier,
          startDate: auction.startDate,
          endDate: auction.endDate > DateUtils.getCurrentTimestampPlusYears(1) ? 0 : auction.endDate,
          nrAuctionedTokens: auction.nrAuctionedTokens || 1,
          minBid: new Price({
            token: auction.paymentToken,
            nonce: 0,
            amount: auction.minBid,
            timestamp: DateUtils.getTimestamp(auction.creationDate),
          }),
          minBidDiff: new Price({
            token: auction.paymentToken,
            nonce: 0,
            amount: auction.minBidDiff,
            timestamp: DateUtils.getTimestamp(auction.creationDate),
          }),
          maxBid: new Price({
            token: auction.paymentToken,
            nonce: 0,
            amount: auction.maxBid,
            timestamp: DateUtils.getTimestamp(auction.creationDate),
          }),
          tags: auction.tags.split(',').filter((i) => i),
          creationDate: DateUtils.getTimestamp(auction.creationDate),
          marketplaceKey: auction.marketplaceKey,
          marketplaceAuctionId: auction.marketplaceAuctionId,
          startBid: auction.startBid,
        });
  }
}
