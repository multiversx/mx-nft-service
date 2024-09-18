import { InputType, Field } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ScamInfoTypeEnum } from 'src/modules/assets/models';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class ScamUpdateInput {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  collectionIdentifier: string;

  @Field(() => ScamInfoTypeEnum)
  type: ScamInfoTypeEnum;
}
