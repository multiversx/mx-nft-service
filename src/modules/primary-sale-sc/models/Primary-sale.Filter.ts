import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class PrimarySaleFilter {
  @Field(() => String)
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  collectionName: string;

  constructor(init?: Partial<PrimarySaleFilter>) {
    Object.assign(this, init);
  }
}
