import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SetNftRolesArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  addressToTransfer: string;
  @Field(() => String)
  role: string;
}
