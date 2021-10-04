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

  @Field(() => String)
  quantity: string = '1';

  @Field(() => String)
  name: string;

  @Field(() => String)
  royalties: string = '0';

  @Field(() => AttributeInput)
  attributes: AttributeInput;

  file: FileUpload;
}
