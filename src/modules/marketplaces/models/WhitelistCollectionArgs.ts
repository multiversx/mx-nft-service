import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import {
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
} from 'src/utils/constants';

@InputType()
export class WhitelistCollectionArgs {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field()
  collection: string;

  @Field()
  marketplaceKey: string;
}
