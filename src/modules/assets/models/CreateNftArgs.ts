import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import {
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
} from 'src/utils/constants';

@InputType()
export class AttributeInput {
  @Field(() => [String])
  tags: string[];

  @Field(() => String)
  description: string;
}

@InputType()
export class CreateNftArgs {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
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
}
