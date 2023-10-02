import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateMarketplaceArgs {
  @Field({ description: 'This field will be shown on external apps like xSpothlight, xPortal!', nullable: true })
  marketplaceName: string;

  @Field({ description: 'This should de a unique key, so choose wisely!' })
  marketplaceKey: string;

  @Field({ description: 'This will be used to redirect from external apps!', nullable: true })
  marketplaceUrl: string;

  @Field({ description: 'Smart Contract Address, if not sent the default one will be used', nullable: true })
  marketplaceScAddress: string;
}
