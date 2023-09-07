import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { TierEntity } from 'src/db/campaigns/tiers.entity';
import { TierStatusEnum } from './CampaignStatus.enum';
import { MintPrice } from './MintPrice.dto';

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

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => TierStatusEnum)
  status: TierStatusEnum;

  constructor(init?: Partial<Tier>) {
    Object.assign(this, init);
  }

  static fromEntity(tier: TierEntity, campaignId: string) {
    return tier
      ? new Tier({
          tierName: tier.tierName,
          availableNfts: tier.availableNfts,
          totalNfts: tier.totalNfts,
          campaignId: campaignId,
          mintPrice: new MintPrice({
            amount: tier.mintPrice,
            token: tier.mintToken,
          }),
          status: tier.availableNfts > 0 ? TierStatusEnum.Running : TierStatusEnum.Sold,
        })
      : null;
  }
}
