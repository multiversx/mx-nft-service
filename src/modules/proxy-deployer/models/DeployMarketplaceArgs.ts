import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';
import { ADDRESS_ERROR, ADDRESS_RGX, NUMERIC_ERROR, NUMERIC_RGX } from 'src/utils/constants';

@InputType()
export class DeployMarketplaceArgs {
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  @Field()
  ownerAddress: string;

  @Field()
  @Matches(RegExp(NUMERIC_RGX), { message: `Marketplace fee ${NUMERIC_ERROR}` })
  marketplaceFee: string;

  @Field(() => [String], {
    description: 'The accepted payment tokens for auction on the marketplace. By default, if left empty, accepts all payment tokens',
    nullable: true,
  })
  paymentTokens: string[];
}
