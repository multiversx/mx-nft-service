import { ArgsType, Field } from '@nestjs/graphql';

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
export class CreateOrderArgs {
  @Field(() => String)
  priceTokenIdentifier: string;
  @Field(() => String)
  priceAmount: string;
  @Field(() => String)
  priceNonce: string;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Number)
  auctionId: number;
}

@ArgsType()
export class AddTagsArgs {
  @Field(() => String)
  tokenIdentifier: string;
  @Field(() => [String])
  tags: [string];
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
