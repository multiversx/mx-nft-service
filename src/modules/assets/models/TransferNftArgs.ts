import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  token: string;
  @Field(() => String)
  nonce: string;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => String)
  quantity: string;
  @Field(() => String)
  destinationAddress: string;
}
