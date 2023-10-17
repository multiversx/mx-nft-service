import { OfferStatusEnum } from 'src/modules/offers/models';
import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('offers')
@Unique('OfferEntity_UQ_Marketplace', ['marketplaceOfferId', 'marketplaceKey'])
export class OfferEntity extends BaseEntity {
  @Column()
  marketplaceOfferId: number;
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
  @Index('offer_collection')
  collection: string;

  @Column()
  @Index('offer_end_date')
  endDate: number;

  @Column({ nullable: true, length: 62 })
  boughtTokensNo: string;

  @Column({ length: 64 })
  blockHash: string;

  @Column({ length: 62 })
  @Index('offer_marketplace_key')
  marketplaceKey: string;

  constructor(init?: Partial<OfferEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromEventTopics(
    offerEventTopics: {
      offerOwner: string;
      collection: string;
      nonce: string;
      offerId: number;
      nrOfferTokens: number;
      paymentTokenIdentifier: string;
      paymentTokenNonce: number;
      paymentAmount: string;
      startdate: string;
      enddate: string;
    },
    blockHash: string,
    marketplaceKey: string,
    status: OfferStatusEnum,
  ): OfferEntity {
    if (!offerEventTopics) return null;
    return new OfferEntity({
      blockHash: blockHash,
      boughtTokensNo: offerEventTopics.nrOfferTokens.toString(),
      collection: offerEventTopics.collection,
      identifier: `${offerEventTopics.collection}-${offerEventTopics.nonce}`,
      marketplaceKey: marketplaceKey,
      marketplaceOfferId: offerEventTopics.offerId,
      ownerAddress: offerEventTopics.offerOwner,
      priceAmount: offerEventTopics.paymentAmount,
      priceNonce: offerEventTopics.paymentTokenNonce,
      priceToken: offerEventTopics.paymentTokenIdentifier,
      status: status,
      endDate: parseInt(offerEventTopics.enddate),
    });
  }
}
