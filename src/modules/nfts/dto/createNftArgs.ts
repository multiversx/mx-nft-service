import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export default class CreateNftArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  tokenNonce: string;
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
}

@ArgsType()
export class TransferNftArgs {
  @Field(() => String!)
  tokenIdentifier: string;
  @Field(() => String!)
  ownerAddress: string;
  @Field(() => String)
  quantity: string;
  @Field(() => String!)
  destinationAddress: string;
}

@ArgsType()
export class CreateAssetArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => String)
  tokenNonce: string;
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
