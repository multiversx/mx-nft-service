import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AddSftQuantityArgs {
  @Field(() => String)
  ownerAddress: string;

  @Field(() => String)
  tokenIdentifier: string;

  @Field(() => Int)
  nonce: number;

  @Field(() => Int)
  quantity: number;
}
