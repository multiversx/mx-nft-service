import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  collection: string;
  @Field(() => Int)
  nonce: number;
  @Field(() => Int)
  quantity: number;
  @Field(() => String)
  destinationAddress: string;
}
