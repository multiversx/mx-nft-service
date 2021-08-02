import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { Account } from 'src/modules/accounts/models/account.dto';
import { Asset, Price } from 'src/modules/assets/models';
import { Order } from 'src/modules/orders/models';
import { AuctionStatusEnum } from '.';

@ObjectType()
export class Auction {
  @Field(() => ID)
  id: number;

  @Field(() => String, { nullable: true })
  ownerAddress: string;

  @Field(() => AuctionStatusEnum, { nullable: true })
  status: AuctionStatusEnum;

  @Field(() => String)
  collection: string;

  @Field(() => String)
  identifier: string;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int, { nullable: true })
  nrAuctionedTokens: number;

  @Field(() => Asset)
  asset: Asset;

  @Field(() => Price)
  minBid: Price;

  @Field(() => Price)
  maxBid: Price;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;

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
    return auction
      ? new Auction({
          id: auction.id,
          status: auction.status,
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
        })
      : null;
  }
}
