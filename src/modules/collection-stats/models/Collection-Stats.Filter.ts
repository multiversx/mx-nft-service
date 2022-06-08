import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { NFT_IDENTIFIER_ERROR, NFT_IDENTIFIER_RGX } from 'src/utils/constants';

@InputType()
export class CollectionStatsFilter {
  @Field(() => String)
  @Matches(RegExp(NFT_IDENTIFIER_RGX), { message: NFT_IDENTIFIER_ERROR })
  identifier: string;
  constructor(init?: Partial<CollectionStatsFilter>) {
    Object.assign(this, init);
  }
}
