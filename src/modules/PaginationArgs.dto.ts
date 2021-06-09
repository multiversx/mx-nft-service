import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export default class PaginationArgs {
  @Field(() => Int, { nullable: true })
  offset: number;

  @Field(() => Int, { nullable: true })
  size: number;

  constructor(init?: Partial<PaginationArgs>) {
    Object.assign(this, init);
  }
}
