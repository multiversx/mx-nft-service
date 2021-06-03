import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StopNftCreateArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  ownerAddress: string;
}
