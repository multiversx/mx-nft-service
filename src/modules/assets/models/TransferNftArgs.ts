import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  identifier: string;
  @Field(() => Int)
  quantity: number;
  @Field(() => String)
  destinationAddress: string;
}
