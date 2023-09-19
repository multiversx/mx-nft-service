import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX, NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX, NUMERIC_ERROR, NUMERIC_RGX } from 'src/utils/constants';

@InputType()
export class TransferNftArgs {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String)
  identifier: string;

  @Matches(RegExp(NUMERIC_RGX), { message: `Quantity ${NUMERIC_ERROR}` })
  @Field(() => String)
  quantity: string = '1';

  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String)
  destinationAddress: string;
}
