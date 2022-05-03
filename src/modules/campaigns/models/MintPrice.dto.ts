import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MintPrice {
  @Field(() => ID)
  token: string;
  @Field()
  amount: string;

  constructor(init?: Partial<MintPrice>) {
    Object.assign(this, init);
  }
}
