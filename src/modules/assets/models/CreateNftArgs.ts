import { Field, InputType, Int } from '@nestjs/graphql';
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
  collection: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  royalties: string;

  @Field(() => AttributeInput)
  attributes: AttributeInput;

  file: FileUpload;
}
