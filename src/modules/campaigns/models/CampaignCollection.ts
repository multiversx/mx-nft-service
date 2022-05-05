import { Field, ObjectType } from '@nestjs/graphql';
import { CampaignEntity } from 'src/db/campaigns';

@ObjectType()
export class CampaignCollection {
  @Field(() => String)
  collectionName: string;
  @Field(() => String)
  collectionTicker: string;

  @Field(() => String)
  collectionHash: string;

  @Field(() => String)
  royalties: string;

  constructor(init?: Partial<CampaignCollection>) {
    Object.assign(this, init);
  }

  static fromEntity(campaign: CampaignEntity) {
    return campaign
      ? new CampaignCollection({
          collectionHash: campaign.collectionHash,
          collectionName: campaign.collectionName,
          collectionTicker: campaign.collectionTicker,
          royalties: campaign.royalties,
        })
      : null;
  }
}
