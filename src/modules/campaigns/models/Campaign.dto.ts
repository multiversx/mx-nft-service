import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CampaignEntity } from 'src/db/campaigns';
import { CampaignStatusEnum } from './CampaignStatus.enum';
import { Tier } from './Tier.dto';

@ObjectType()
export class Campaign {
  @Field(() => ID)
  campaignId!: string;
  @Field(() => String)
  minterAddress!: string;

  @Field(() => String)
  collectionName: string;

  @Field(() => String)
  mediaType: string;

  @Field(() => Boolean)
  verified: boolean;

  @Field(() => CampaignStatusEnum)
  status: CampaignStatusEnum;

  @Field(() => String)
  collectionTicker: string;

  @Field(() => String)
  collectionHash: string;

  @Field(() => String)
  royalties: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => Int)
  totalNfts: number;

  @Field(() => Int)
  availableNfts: number;

  @Field(() => Int)
  startDate: number;

  @Field(() => Int)
  endDate: number;

  @Field(() => [Tier])
  tiers: Tier[];

  constructor(init?: Partial<Campaign>) {
    Object.assign(this, init);
  }

  static fromEntity(campaign: CampaignEntity) {
    return campaign
      ? new Campaign({
          campaignId: campaign.campaignId,
          collectionHash: campaign.collectionHash,
          collectionName: campaign.collectionName,
          collectionTicker: campaign.collectionTicker,
          mediaType: campaign.mediaType,
          minterAddress: campaign.minterAddress,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          royalties: campaign.royalties,
          description: campaign.description,
          totalNfts: campaign.tiers
            .map((t) => t.totalNfts)
            .reduce((partialSum, a) => partialSum + a, 0),
          availableNfts: campaign.tiers
            .map((t) => t.availableNfts)
            .reduce((partialSum, a) => partialSum + a, 0),
          tiers: campaign.tiers.map((t) =>
            Tier.fromEntity(t, campaign.campaignId),
          ),
        })
      : null;
  }
}
