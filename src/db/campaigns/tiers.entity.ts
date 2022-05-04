import { TierInfoAbi } from 'src/modules/campaigns/models/abi/TierInfoAbi';
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

  @Column({ length: 20 })
  mintToken: string;

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

  static fromTierAbi(tier: TierInfoAbi) {
    return tier
      ? new TierEntity({
          tierName: tier.tier.valueOf().toString(),
          mintToken: tier.mint_price.token_id.valueOf().toString(),
          mintPrice: tier.mint_price.amount.valueOf().toString(),
          mintPriceDenominated: parseFloat(
            denominate({
              input: tier.mint_price.amount.valueOf()?.toString(),
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }).replace(',', ''),
          ),
          totalNfts: parseInt(tier.total_nfts.valueOf().toString()),
          availableNfts: parseInt(tier.available_nfts.valueOf().toString()),
        })
      : null;
  }
}
