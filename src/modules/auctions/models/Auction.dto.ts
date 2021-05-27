import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from 'src/modules/accounts/models/account.dto';
import { Asset, Price } from 'src/modules/assets/models';
import { Order } from 'src/modules/orders/models';
import { AuctionStatusEnum } from './Auction-status.enum';

@ObjectType()
export class Auction {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  ownerAddress: string;

  @Field(() => Account)
  owner: Account;

  @Field(() => AuctionStatusEnum)
  status: AuctionStatusEnum;

  tokenNonce: number;

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

  @Field(() => Price, { nullable: true })
  topBid: Price;

  @Field(() => Account, { nullable: true })
  topBidder: Account;

  @Field(() => [Order])
  orders: Order[];

  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }
}
