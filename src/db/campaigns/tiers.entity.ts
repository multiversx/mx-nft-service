import { BrandInfoViewResultType } from 'src/modules/campaigns/models/abi/BrandInfoViewAbi';
import denominate from 'src/utils/formatters';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { CampaignEntity } from './campaign.entity';
import { TierDetailEntity } from './tier-details.entity';

@Entity('tiers')
export class TierEntity extends BaseEntity {
  @Column()
  campaignId: number;

  @Column({ length: 20 })
  tierName: string;

  @Column()
  mintPrice: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  mintPriceDenominated: number;

  @Column()
  totalNfts: number;

  @Column()
  availableNfts: number;

  @OneToMany(() => TierDetailEntity, (details) => details.tier)
  tierDetails: TierDetailEntity[];

  @ManyToOne(() => CampaignEntity, (campaign) => campaign.tiers)
  @JoinColumn({ name: 'campaignId', referencedColumnName: 'id' })
  campaign: CampaignEntity;

  constructor(init?: Partial<TierEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromCampaignAbi(campaign: BrandInfoViewResultType, address: string) {
    return campaign
      ? new TierEntity({
          mintPrice: campaign.mint_price.amount.valueOf().toString(),
          mintPriceDenominated: parseFloat(
            denominate({
              input: campaign.mint_price.amount.valueOf()?.toString(),
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }).replace(',', ''),
          ),

          totalNfts: parseInt(campaign.total_nfts.valueOf().toString()),
          availableNfts: parseInt(campaign.available_nfts.valueOf().toString()),
        })
      : null;
  }
}
