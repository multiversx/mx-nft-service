import { Field, InputType } from '@nestjs/graphql';
import { FileUpload } from 'graphql-upload';

@InputType()
export class CreateNftArgs {
  @Field(() => String)
  tokenIdentifier: string;

  @Field(() => String)
  quantity: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  royalties: string;

  @Field(() => String)
  attributes: string;

  @Field(() => String)
  ownerAddress: string;

  file: FileUpload;
}
