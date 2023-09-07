import { InputType, Field } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { COLLECTION_IDENTIFIER_ERROR, COLLECTION_IDENTIFIER_RGX, NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class ClearReportInput {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String)
  identifier: string;
}

@InputType()
export class ClearReportCollectionInput {
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  @Field(() => String)
  collectionIdentifier: string;
}
