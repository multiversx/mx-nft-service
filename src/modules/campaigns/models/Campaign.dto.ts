import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CampaignEntity } from 'src/db/campaigns';
import { CampaignCollection } from './CampaignCollection';
import { CampaignStatusEnum } from './CampaignStatus.enum';
import { Tier } from './Tier.dto';

@ObjectType()
export class Campaign {
  @Field(() => ID)
  campaignId!: string;

  @Field(() => String)
  minterAddress!: string;

  @Field(() => String)
  mediaType: string;

  @Field()
  verified: boolean;

  @Field(() => CampaignStatusEnum)
  status: CampaignStatusEnum;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => Int)
  totalNfts: number;

  @Field(() => Int)
  availableNfts: number;

  @Field(() => Int)
  maxNftsPerTransaction: number;

  @Field(() => Int)
  startDate: number;

  @Field(() => Int)
  endDate: number;

  @Field(() => Int, {
    description: 'This is the timestamp when the whitelist period expires',
  })
  whitelistExpire: number;

  @Field(() => [Tier])
  tiers: Tier[];

  @Field(() => CampaignCollection)
  collection: CampaignCollection;

  constructor(init?: Partial<Campaign>) {
    Object.assign(this, init);
  }

  static fromEntity(campaign: CampaignEntity) {
    return campaign
      ? new Campaign({
          campaignId: campaign.campaignId,
          collection: CampaignCollection.fromEntity(campaign),
          mediaType: campaign.mediaType,
          minterAddress: campaign.minterAddress,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          whitelistExpire: campaign.whitelistExpireTimestamp,
          description: campaign.description,
          maxNftsPerTransaction: campaign.maxNftsPerTransaction,
          totalNfts: campaign.tiers.map((t) => t.totalNfts).reduce((partialSum, a) => partialSum + a, 0),
          availableNfts: campaign.tiers.map((t) => t.availableNfts).reduce((partialSum, a) => partialSum + a, 0),
          tiers: campaign.tiers.map((t) => Tier.fromEntity(t, campaign.campaignId)),
        })
      : null;
  }
}
