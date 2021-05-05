import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export default class PaginationArgs {
  @Field((type) => Int)
  offset: number = 0;

  @Field((type) => Int)
  limit: number = 10;
}
