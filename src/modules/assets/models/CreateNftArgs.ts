import { Field, InputType } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload';

@InputType()
export class CreateNftArgs {
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

  @Field(() => GraphQLUpload)
  file: any;
}
