import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import {
  ADDRESS_ERROR,
  ADDRESS_RGX,
  NFT_IDENTIFIER_ERROR,
  NFT_IDENTIFIER_RGX,
} from 'src/utils/constants';

@InputType()
export class HandleQuantityArgs {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field(() => String)
  addOrBurnRoleAddress: string;

  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String)
  identifier: string;

  @Field(() => String)
  quantity: string;
}
