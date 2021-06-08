import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => Int)
  tokenNonce: number;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Int)
  quantity: number;
  @Field(() => String)
  destinationAddress: string;
}
