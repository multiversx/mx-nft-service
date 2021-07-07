import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TransferNftCreateRoleArgs {
  @Field(() => String)
  collection: string;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => [String])
  addressToTransferList: string[];
}
