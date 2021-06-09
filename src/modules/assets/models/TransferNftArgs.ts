import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  token: string;
  @Field(() => Int)
  nonce: number;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Int)
  quantity: number;
  @Field(() => String)
  destinationAddress: string;
}
