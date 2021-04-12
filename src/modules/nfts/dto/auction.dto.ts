import { Account } from './account.dto';
import { Order } from './order.dto';
import { Asset } from './asset.dto';
import { Price } from './price.dto';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Auction {
  @Field(() => ID)
  auctionId: string;
  @Field(() => Account)
  owner: Account;
  @Field(() => Asset)
  asset: Asset;
  @Field(() => Price)
  minBid: Price;
  @Field(() => Price)
  maxBid: Price;
  @Field(() => Date)
  startDate: Date;
  @Field(() => Date)
  endDate: Date;
  @Field(() => Price)
  topBid?: Price;
  @Field(() => Account)
  topBidder?: Account;
  @Field(() => [Order])
  orders: Order[];
}
