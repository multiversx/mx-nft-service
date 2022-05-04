import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { TierEntity } from 'src/db/campaigns/tiers.entity';
import { MintPrice } from './MintPrice.dto';
import { TierDetail } from './TierDetails.dto';

@ObjectType()
export class Tier {
  @Field(() => ID)
  campaignId!: string;

  @Field(() => String)
  tierName!: string;

  @Field(() => Int)
  totalNfts: number;

  @Field(() => Int)
  availableNfts: number;

  @Field(() => MintPrice)
  mintPrice: MintPrice;

  @Field(() => [TierDetail])
  details: TierDetail[];

  constructor(init?: Partial<Tier>) {
    Object.assign(this, init);
  }

  static fromEntity(tier: TierEntity) {
    return tier
      ? new Tier({
          availableNfts: tier.availableNfts,
          totalNfts: tier.totalNfts,
          campaignId: tier.campaign.campaignId,
          mintPrice: new MintPrice({
            amount: tier.mintPrice,
            token: tier.campaign.mintToken,
          }),
        })
      : null;
  }
}
