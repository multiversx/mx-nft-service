import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from 'src/modules/accounts/models/account.dto';
import { Price } from 'src/modules/assets/models';
import { Auction } from 'src/modules/auctions/models';
import { OrderStatusEnum } from './order-status.enum';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  ownerAddress: string;

  @Field(() => Account)
  from: Account;

  @Field(() => Auction)
  auction: Auction;

  @Field(() => Price)
  price: Price;

  @Field(() => OrderStatusEnum)
  status: OrderStatusEnum;

  @Field(() => Date)
  creationDate: Date;

  @Field(() => Date)
  endDate: Date;

  constructor(init?: Partial<Order>) {
    Object.assign(this, init);
  }
}
