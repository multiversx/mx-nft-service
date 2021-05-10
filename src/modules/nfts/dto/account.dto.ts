import { Asset } from './asset.dto';
import { Auction } from './auction.dto';
import { Order } from './order.dto';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Account {
  @Field(() => Number)
  id: Number;

  @Field(() => ID)
  address: string;

  @Field({ nullable: true })
  profileImgUrl: string;

  @Field({ nullable: true })
  herotag: string;

  @Field(() => [Asset])
  assets: Asset[];

  @Field(() => [Order])
  orders: Order[];

  @Field(() => [Auction])
  auctions: Auction[];

  @Field(() => [Account])
  followers: Account[];

  @Field(() => [Account])
  following: Account[];

  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }
}
