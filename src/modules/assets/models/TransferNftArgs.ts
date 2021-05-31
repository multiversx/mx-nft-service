import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  tokenNonce: string;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => String)
  quantity: string;
  @Field(() => String)
  destinationAddress: string;
}
