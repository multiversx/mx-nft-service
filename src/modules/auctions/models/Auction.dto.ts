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

  @Field(() => Number)
  tokenNonce: number;

  @Field(() => String)
  tokenIdentifier: string;

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

  @Field(() => [Order])
  orders: Order[];

  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }
}
