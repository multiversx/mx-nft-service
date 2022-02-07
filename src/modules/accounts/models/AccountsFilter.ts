import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AccountsFilter {
  @Field(() => [String])
  addresses: string[];
}

@InputType()
export class AccountStatsFilter {
  @Field(() => [String])
  addresses: string[];
}
