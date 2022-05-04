import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CampaignEntity } from 'src/db/campaigns';
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

  @Field(() => String)
  collectionTicker: string;

  @Field(() => String)
  collectionHash: string;

  @Field(() => String)
  royalties: string;

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
          availableNfts: campaign.availableNfts,
          totalNfts: campaign.totalNfts,
          campaignId: campaign.campaignId,
          collectionHash: campaign.collectionHash,
          collectionName: campaign.collectionName,
          collectionTicker: campaign.collectionTicker,
          mediaType: campaign.mediaType,
          minterAddress: campaign.minterAddress,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          royalties: campaign.royalties,
        })
      : null;
  }
}
