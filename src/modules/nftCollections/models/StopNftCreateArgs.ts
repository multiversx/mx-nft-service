import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StopNftCreateArgs {
  @Field(() => String)
  collection: string;
  @Field(() => String)
  ownerAddress: string;
}
