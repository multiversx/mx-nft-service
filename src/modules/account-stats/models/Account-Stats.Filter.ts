import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX } from 'src/utils/constants';

@InputType()
export class AccountStatsFilter {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String)
  address: string;
  @Field(() => Boolean, { nullable: true })
  isOwner: boolean;
  @Field(() => String, { nullable: true })
  marketplaceKey: string;
  constructor(init?: Partial<AccountStatsFilter>) {
    Object.assign(this, init);
  }
}
