import { Account } from './account.dto';
import { Order } from './order.dto';
import { Asset } from './asset.dto';
import { Price } from './price.dto';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Auction {
  @Field(() => ID)
  Id: string;

  ownerAddress: string;

  @Field(() => Account)
  owner: Account;

  tokenIdentifier: string;
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

  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }
}

@InputType()
export class CreateAuctionArgs {
  @Field(() => String!)
  ownerAddress: string;

  @Field(() => String!)
  tokenIdentifier: string;

  @Field(() => String!)
  nonce: string;

  @Field(() => String!)
  minBid: string;

  @Field(() => String!)
  maxBid: string;

  @Field(() => String!)
  deadline: string;

  @Field(() => String!)
  paymentTokenIdentifier: String;
}
