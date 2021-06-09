import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Price {
  @Field(() => ID)
  token: string;
  @Field()
  amount: string;
  @Field(() => Int)
  nonce: number;

  constructor(init?: Partial<Price>) {
    Object.assign(this, init);
  }
}
