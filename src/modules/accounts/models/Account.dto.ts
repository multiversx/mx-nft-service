import { Auction } from '../../auctions/models';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Asset } from '../../assets/models';
import { Order } from '../../orders/models';
import { SocialLink } from './SocialLink.dto';
import { AccountIdentity } from 'src/common/services/elrond-communication/models/account.identity';

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

  @Field(() => [Account], { nullable: true })
  followers: Account[];

  @Field(() => [Account], { nullable: true })
  following: Account[];

  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  static fromEntity(account: AccountIdentity) {
    return new Account({
      address: account.address,
      description: account?.description,
      profile: account?.profile,
      cover: account?.cover,
      herotag: account?.herotag,
      socialLinks: account?.socialLinks?.map(
        (elem) => new SocialLink({ type: elem?.type, url: elem?.url }),
      ),
    });
  }
}
