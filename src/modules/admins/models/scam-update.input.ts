import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class ScamUpdateInput {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  collectionIdentifier: string;

  @Field(() => ScamInputEnum)
  type: ScamInputEnum;
}

export enum ScamInputEnum {
  deny = 'deny',
  allow = 'allow'
}

registerEnumType(ScamInputEnum, {
  name: 'ScamInputEnum',
});
