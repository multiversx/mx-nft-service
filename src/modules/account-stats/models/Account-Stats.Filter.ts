import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AccountStatsFilter {
  @Field(() => String)
  address: string;
  @Field(() => Boolean, { nullable: true })
  isOwner: string;
}
