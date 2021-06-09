import { Auction } from '../../auctions/models';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Asset } from '../../assets/models';
import { Order } from '../../orders/models';

@ObjectType()
export class Account {
  @Field(() => Number)
  id: number;

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
