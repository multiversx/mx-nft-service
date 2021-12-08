import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Asset } from 'src/modules/assets/models';
import { Order } from 'src/modules/orders/models';
import { SocialLink, FollowerResponse } from '.';
import { AccountIdentity } from 'src/common';
import { Auction } from 'src/modules/auctions/models';

@ObjectType()
export class Account {
  @Field(() => ID, { nullable: true })
  address: string;
  @Field({ nullable: true })
  description: string;
  @Field({ nullable: true })
  profile: string;
  @Field({ nullable: true })
  cover: string;
  @Field({ nullable: true })
  herotag: string;

  @Field(() => [SocialLink], { nullable: true })
  socialLinks: SocialLink[];

  @Field(() => [Asset], { nullable: true })
  assets: Asset[];

  @Field(() => [Order], { nullable: true })
  orders: Order[];

  @Field(() => [Auction], { nullable: true })
  auctions: Auction[];

  @Field(() => FollowerResponse, { nullable: true })
  followers: FollowerResponse;

  @Field(() => FollowerResponse, { nullable: true })
  following: FollowerResponse;

  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  static fromEntity(account: AccountIdentity, address: string = '') {
    return account
      ? new Account({
          address: account.address,
          description: account?.description,
          profile: account?.profile?.url,
          cover: account?.cover?.url,
          herotag: account?.herotag,
          socialLinks: account?.socialLinks?.map(
            (elem) => new SocialLink({ type: elem?.type, url: elem?.url }),
          ),
        })
      : new Account({ address: address });
  }
}
