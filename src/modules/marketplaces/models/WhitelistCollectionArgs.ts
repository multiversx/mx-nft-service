import { Field, InputType } from '@nestjs/graphql';
import { Matches, MaxLength } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class WhitelistCollectionArgs {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field()
  collection: string;

  @MaxLength(62)
  @Field()
  marketplaceKey: string;
}

@InputType()
export class RemoveWhitelistCollectionArgs {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field()
  collection: string;

  @MaxLength(62)
  @Field()
  marketplaceKey: string;
}
