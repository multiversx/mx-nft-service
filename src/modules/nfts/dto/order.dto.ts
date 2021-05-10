import { Price } from './price.dto';
import { Auction } from './auction.dto';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Account } from './account.dto';

@ObjectType()
export class Order {
  @Field(() => ID)
  orderId: string;

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
}
