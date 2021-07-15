import { Auction } from '../../auctions/models';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Asset } from '../../assets/models';
import { Order } from '../../orders/models';
import { ApiAccount } from 'src/common/services/elrond-communication/models/nft.dto';

@ObjectType()
export class Account {
  @Field(() => ID)
  address: string;

  @Field(() => [Asset], { nullable: true })
  assets: Asset[];

  @Field(() => [Order], { nullable: true })
  orders: Order[];

  @Field(() => [Auction], { nullable: true })
  auctions: Auction[];

  @Field(() => [Account], { nullable: true })
  followers: Account[];

  @Field(() => [Account], { nullable: true })
  following: Account[];

  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }
}
