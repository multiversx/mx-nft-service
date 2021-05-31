import { Field, InputType } from '@nestjs/graphql';
import { FileUpload } from 'graphql-upload';

@InputType()
export class AttributeInput {
  @Field(() => [String])
  tags: string[];

  @Field(() => String)
  description: string;
}

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

  @Field(() => AttributeInput)
  attributes: AttributeInput;

  @Field(() => String)
  ownerAddress: string;

  file: FileUpload;
}
