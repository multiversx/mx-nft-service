import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OrderStatusEnum } from './order-status.enum';
import { Auction } from '../../auctions/models';
import { Account } from '../../accounts/models';
import { Price } from '../../assets/models';

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
