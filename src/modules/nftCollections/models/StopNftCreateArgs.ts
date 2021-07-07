import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StopNftCreateArgs {
  @Field(() => String)
  token: string;
  @Field(() => String)
  ownerAddress: string;
}
