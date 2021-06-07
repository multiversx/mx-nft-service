import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export default class PaginationArgs {
  @Field(() => Int, { nullable: true })
  first: number;

  @Field(() => String, { nullable: true })
  after: string;

  @Field(() => Int, { nullable: true })
  last: number;

  @Field(() => String, { nullable: true })
  before: string;
}
