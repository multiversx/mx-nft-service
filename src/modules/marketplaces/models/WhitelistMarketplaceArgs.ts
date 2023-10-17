import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, Matches, MaxLength } from 'class-validator';
import { ADDRESS_RGX, ADDRESS_ERROR } from 'src/utils/constants';

@InputType()
export class WhitelistMarketplaceArgs {
  @Field({ description: 'This field will be shown on external apps like xSpothlight, xPortal!' })
  marketplaceName: string;

  @MaxLength(62)
  @Field({ description: 'This should de a unique key, so choose wisely!' })
  marketplaceKey: string;

  @Field({ description: 'This will be used to redirect from external apps!' })
  marketplaceUrl: string;

  @Field({ description: 'Smart Contract Address, if not sent the default one will be used', nullable: true })
  @IsOptional()
  @Matches(RegExp(ADDRESS_RGX), { message: ADDRESS_ERROR })
  marketplaceScAddress: string;
}
