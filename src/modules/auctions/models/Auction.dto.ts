import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { Account } from 'src/modules/accounts/models';
import { Asset, Price } from 'src/modules/assets/models';
import { Order } from 'src/modules/orders/models';
import { AuctionStatusEnum } from '.';
import { AuctionTypeEnum } from './AuctionType.enum';

@ObjectType()
export class Auction {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  ownerAddress: string;

  @Field(() => Account, { nullable: true })
  owner: Account;

  @Field(() => AuctionStatusEnum, { nullable: true })
  status: AuctionStatusEnum;

  @Field(() => AuctionTypeEnum, { nullable: true })
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

  @Field(() => Asset, { nullable: true })
  asset: Asset;

  @Field(() => Price)
  minBid: Price;

  @Field(() => Price)
  maxBid: Price;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;

  @Field({ nullable: true })
  tags: string;

  @Field(() => Price, { nullable: true })
  topBid: Price;

  @Field(() => Account, { nullable: true })
  topBidder: Account;

  @Field(() => [Order], { nullable: true })
  orders: Order[];

  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: AuctionEntity) {
    console.log(auction);
    return auction
      ? new Auction({
          id: auction.id,
          status: auction.status,
          type: auction.type,
          ownerAddress: auction.ownerAddress,
          collection: auction.collection,
          nonce: auction.nonce,
          identifier: auction.identifier,
          startDate: auction.startDate,
          endDate: auction.endDate,
          nrAuctionedTokens: auction.nrAuctionedTokens || 1,
          minBid: new Price({
            token: 'EGLD',
            nonce: 0,
            amount: auction.minBid,
          }),
          maxBid: new Price({
            token: 'EGLD',
            nonce: 0,
            amount: auction.maxBid,
          }),
          tags: auction.tags,
        })
      : null;
  }
}
