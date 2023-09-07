import { mxConfig } from 'src/config';
import { TierInfoAbi } from 'src/modules/campaigns/models/abi/TierInfoAbi';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { CampaignEntity } from './campaign.entity';

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

  @Column()
  description: string;

  @ManyToOne(() => CampaignEntity, (campaign) => campaign.tiers)
  @JoinColumn({ name: 'campaignId', referencedColumnName: 'id' })
  campaign: CampaignEntity;

  constructor(init?: Partial<TierEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromTierAbi(tier: TierInfoAbi, decimals: number = mxConfig.decimals) {
    return tier
      ? new TierEntity({
          tierName: tier.tier.valueOf().toString(),
          mintToken: tier.mint_price.token_id.valueOf().toString(),
          mintPrice: tier.mint_price.amount.valueOf().toString(),
          mintPriceDenominated: BigNumberUtils.denominateAmount(tier.mint_price.amount.valueOf().toString(), decimals),
          totalNfts: parseInt(tier.total_nfts.valueOf().toString()),
          availableNfts: parseInt(tier.available_nfts.valueOf().toString()),
          description: 'This is a default description for tier',
        })
      : null;
  }
}
