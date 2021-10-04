import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class TransferNftArgs {
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  quantity: string = '1';
  @Field(() => String)
  destinationAddress: string;
}
