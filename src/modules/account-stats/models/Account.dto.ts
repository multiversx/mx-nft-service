import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AccountIdentity } from 'src/common';
import { SocialLink } from './SocialLink.dto';

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
