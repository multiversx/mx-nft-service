import { Field, InputType, Int } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';
import {
  COLLECTION_IDENTIFIER_ERROR,
  COLLECTION_IDENTIFIER_RGX,
  NUMERIC_ERROR,
  NUMERIC_RGX,
} from 'src/utils/constants';

@InputType()
export class ConfigureCollectionArgs {
  @Field(() => String)
  @MinLength(3, { message: 'The token name should have at least 3 caracters' })
  @MaxLength(20, { message: 'The token name should have at most 20 caracters' })
  @Matches(RegExp(COLLECTION_IDENTIFIER_RGX), {
    message: COLLECTION_IDENTIFIER_ERROR,
  })
  collectionName: string;
  @Field(() => String)
  @Matches(RegExp(NUMERIC_RGX), { message: `Price ${NUMERIC_ERROR}` })
  price: string;

  @Field(() => Int)
  maxNftsPerWallet: number;
}
