import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class RemoveLikeArgs {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String)
  identifier: string;
}
