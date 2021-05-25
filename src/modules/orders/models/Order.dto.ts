import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from 'src/modules/accounts/models/account.dto';
import { Price } from 'src/modules/assets/models';
import { Auction } from 'src/modules/auctions/models';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => Account)
  from: Account;

  @Field(() => Auction)
  auction: Auction;

  @Field(() => Price)
  price: Price;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  creationDate: Date;

  constructor(init?: Partial<Order>) {
    Object.assign(this, init);
  }
}
