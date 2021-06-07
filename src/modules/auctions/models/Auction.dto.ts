import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AuctionStatusEnum } from './Auction-status.enum';
import { Account } from '../../accounts/models/account.dto';
import { Asset, Price } from '../../assets/models';
import { Order } from '../../orders/models';

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

  @Field(() => String)
  token: string;

  @Field(() => Number)
  nonce: number;

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
