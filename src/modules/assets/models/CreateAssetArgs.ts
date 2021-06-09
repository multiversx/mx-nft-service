import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAssetArgs {
  @Field(() => String)
  token: string;
  @Field(() => String)
  nonce: string;
  @Field(() => String)
  hash: string;
  @Field(() => String)
  name: string;
  @Field(() => String)
  royalties: string;
  @Field(() => String)
  attributes: string;
  @Field(() => String)
  uri: string;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => String)
  creatorAddress: string;
}
