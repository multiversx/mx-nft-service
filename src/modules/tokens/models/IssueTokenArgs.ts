import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class IssueTokenArgs {
  @Field(() => String)
  tokenName: string;
  @Field(() => String)
  tokenTicker: string;
}
