import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { Account } from 'src/modules/accounts/models';
import { Asset, MaxBid, MinBid, TopBid } from 'src/modules/assets/models';
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

  @Field(() => MinBid)
  minBid: MinBid;

  @Field(() => MaxBid)
  maxBid: MaxBid;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;

  @Field(() => Date)
  creationDate: Date;

  @Field({ nullable: true })
  tags: string;

  @Field(() => TopBid, { nullable: true })
  topBid: TopBid;

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
          type: auction.type,
          ownerAddress: auction.ownerAddress,
          collection: auction.collection,
          nonce: auction.nonce,
          identifier: auction.identifier,
          startDate: auction.startDate,
          endDate: auction.endDate,
          nrAuctionedTokens: auction.nrAuctionedTokens || 1,
          minBid: new MinBid({
            token: 'EGLD',
            nonce: 0,
            amount: auction.minBid,
            timestamp: new Date(auction.creationDate).getTime() / 1000,
          }),
          maxBid: new MaxBid({
            token: 'EGLD',
            nonce: 0,
            amount: auction.maxBid,
            timestamp: new Date(auction.creationDate).getTime() / 1000,
          }),
          tags: auction.tags,
          creationDate: auction.creationDate,
        })
      : null;
  }
}
