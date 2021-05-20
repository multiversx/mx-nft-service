import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Account } from 'src/modules/accounts/models/account.dto';
import { Asset, Price } from 'src/modules/assets/models';
import { Order } from 'src/modules/orders/models';

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
