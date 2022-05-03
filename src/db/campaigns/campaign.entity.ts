import { BrandInfoViewResultType } from 'src/modules/campaigns/models/abi/BrandInfoViewAbi';
import denominate from 'src/utils/formatters';
import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';

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

  @Column({ length: 10 })
  mediaType: string;

  @Column({ length: 62 })
  @Index('minter_address')
  minterAddress: string;

  @Column({ length: 20 })
  mintToken: string;

  @Column()
  mintPrice: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  mintPriceDenominated: number;

  @Column()
  startDate: number;

  @Column()
  endDate: number;

  @Column()
  totalNfts: number;

  @Column()
  availableNfts: number;

  @Column({ length: 10 })
  royalties: string;

  constructor(init?: Partial<CampaignEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromCampaignAbi(campaign: BrandInfoViewResultType, address: string) {
    console.log(
      11111111,
      campaign.brand_info.collection_hash
        .valueOf()
        .map((x) => String.fromCharCode(x))
        .join(''),
    );
    return campaign
      ? new CampaignEntity({
          campaignId: campaign?.brand_id?.valueOf().toString(),
          mintToken: campaign.mint_price?.token_id.valueOf().toString(),
          collectionHash: campaign.brand_info.collection_hash
            .valueOf()
            .map((x) => String.fromCharCode(x))
            .join(''),
          collectionName: campaign.brand_info.token_display_name
            .valueOf()
            .toString(),
          collectionTicker: '',
          mediaType: campaign.brand_info.media_type.valueOf().toString(),
          minterAddress: address,
          mintPrice: campaign.mint_price.amount.valueOf().toString(),
          mintPriceDenominated: parseFloat(
            denominate({
              input: campaign.mint_price.amount.valueOf()?.toString(),
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }).replace(',', ''),
          ),

          startDate: parseInt(
            campaign.brand_info.mint_period.start.valueOf().toString(),
          ),
          endDate: parseInt(
            campaign.brand_info.mint_period.end.valueOf().toString(),
          ),
          totalNfts: parseInt(campaign.total_nfts.valueOf().toString()),
          availableNfts: parseInt(campaign.available_nfts.valueOf().toString()),
          royalties: campaign.brand_info.royalties.valueOf().toString(),
        })
      : null;
  }
}
