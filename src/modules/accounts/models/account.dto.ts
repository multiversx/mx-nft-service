import { Auction } from '../../auctions/models';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Asset } from '../../assets/models';
import { Order } from '../../orders/models';

@ObjectType()
export class Account {
  @Field(() => Int)
  id: number;

  @Field(() => ID)
  address: string;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  profileImgUrl: string;

  @Field({ nullable: true })
  herotag: string;

  @Field(() => [Asset], { nullable: true })
  assets: Asset[];

  @Field(() => [Order], { nullable: true })
  orders: Order[];

  @Field(() => [Auction], { nullable: true })
  auctions: Auction[];

  @Field(() => [Account])
  followers: Account[];

  @Field(() => [Account])
  following: Account[];

  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }
}
