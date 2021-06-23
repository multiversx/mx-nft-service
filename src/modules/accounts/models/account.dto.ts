import { Auction } from '../../auctions/models';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Asset } from '../../assets/models';
import { Order } from '../../orders/models';
import { SocialLink } from 'src/modules/socialLinks/models';
import { AccountEntity } from 'src/db/accounts/account.entity';

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
  coverImgUrl: string;

  @Field({ nullable: true })
  herotag: string;

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

  @Field(() => [SocialLink], { nullable: true })
  socialLinks: SocialLink[];

  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  static fromEntity(account: AccountEntity) {
    return new Account({
      id: account.id,
      address: account.address,
      description: account.description,
      profileImgUrl: account.profileImgUrl,
      coverImgUrl: account.coverImgUrl,
      herotag: account.herotag,
    });
  }
}
