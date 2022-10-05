import { OfferStatusEnum } from 'src/modules/offers/models';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('offers')
export class OfferEntity extends BaseEntity {
  @Column({ length: 20 })
  priceToken: string;

  @Column({ length: 62 })
  priceAmount: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  priceAmountDenominated: number;

  @Column()
  priceNonce: number;

  @Column({ length: 8 })
  @Index('offer_status')
  status: OfferStatusEnum;

  @Column({ length: 62 })
  @Index('offer_owner')
  ownerAddress: string;

  @Column({ length: 30 })
  @Index('offer_identifier')
  identifier: string;

  @Column({ length: 20 })
  @Index('auction_collection')
  collection: string;

  @Column({ nullable: true, length: 62 })
  boughtTokensNo: string;

  @Column({ length: 64 })
  blockHash: string;

  @Column({ length: 20 })
  @Index('offer_marketplace_key')
  marketplaceKey: string;

  constructor(init?: Partial<OfferEntity>) {
    super();
    Object.assign(this, init);
  }
}
