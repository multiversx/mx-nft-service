import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AccountsFilter {
  @Field(() => [String])
  addresses: string[];
}
