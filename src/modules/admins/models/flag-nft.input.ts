import { InputType, Field } from '@nestjs/graphql';
import { Matches, Max, Min } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class FlagNftInput {
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  @Field(() => String)
  identifier: string;
  @Min(0)
  @Max(1)
  @Field()
  nsfwFlag: Number;
}
