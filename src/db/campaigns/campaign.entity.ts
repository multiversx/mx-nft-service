import { mxConfig } from 'src/config';
import { BrandInfoViewResultType } from 'src/modules/campaigns/models/abi/BrandInfoViewAbi';
import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { TierEntity } from './tiers.entity';

@Entity('campaigns')
@Unique('CampaignEntity_UQ', ['minterAddress', 'campaignId'])
export class CampaignEntity extends BaseEntity {
  @Column({ length: 20 })
  campaignId: string;

  @Column({ length: 62 })
  collectionHash: string;

  @Column({ length: 20 })
  collectionName: string;

  @Column({ length: 20 })
  collectionTicker: string;

  @Column()
  maxNftsPerTransaction: number;

  @Column()
  verified: number;

  @Column({ length: 10 })
  mediaType: string;

  @Column({ length: 62 })
  @Index('minter_address')
  minterAddress: string;

  @Column()
  startDate: number;

  @Column()
  endDate: number;

  @Column()
  whitelistExpireTimestamp: number;

  @Column({ length: 10 })
  royalties: string;

  @Column()
  description: string;

  @OneToMany(() => TierEntity, (tier) => tier.campaign)
  tiers: TierEntity[];

  constructor(init?: Partial<CampaignEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromCampaignAbi(
    campaign: BrandInfoViewResultType,
    address: string,
    maxNftsPerTransaction: number,
    decimals: number = mxConfig.decimals,
  ) {
    return campaign
      ? new CampaignEntity({
          campaignId: campaign?.brand_id?.valueOf().toString(),
          collectionHash: campaign.brand_info.collection_hash
            .valueOf()
            .map((x) => String.fromCharCode(x))
            .join(''),
          collectionName: campaign.brand_info.token_display_name.valueOf().toString(),
          collectionTicker: campaign?.nft_token_id?.valueOf().toString(),
          mediaType: campaign.brand_info.media_type.valueOf().toString(),
          minterAddress: address,
          startDate: parseInt(campaign.brand_info.mint_period.start.valueOf().toString()),
          endDate: parseInt(campaign.brand_info.mint_period.end.valueOf().toString()),
          whitelistExpireTimestamp: parseInt(campaign.brand_info.whitelist_expire_timestamp.valueOf().toString()),
          royalties: campaign.brand_info.royalties.valueOf().toString(),
          tiers: campaign.tier_info_entries.map((t) => TierEntity.fromTierAbi(t, decimals)),
          maxNftsPerTransaction: maxNftsPerTransaction,
          verified: 1,
          description: 'This is a default description for a campaign',
        })
      : null;
  }
}
