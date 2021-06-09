import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SetNftRolesArgs {
  @Field(() => String)
  token: string;
  @Field(() => String)
  addressToTransfer: string;
  @Field(() => [String])
  roles: string[];
}
