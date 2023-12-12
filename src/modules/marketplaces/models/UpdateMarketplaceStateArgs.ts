import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_RGX, ADDRESS_ERROR } from 'src/utils/constants';

@InputType()
export class UpdateMarketplaceStateArgs {
  @Field({ description: 'Smart Contract Address' })
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  marketplaceScAddress: string;
}
