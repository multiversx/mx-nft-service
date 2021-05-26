import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Price {
  @Field(() => ID)
  tokenIdentifier: string;
  @Field(() => String)
  amount: string;
  @Field(() => String)
  nonce: string;

  constructor(init?: Partial<Price>) {
    Object.assign(this, init);
  }
}
