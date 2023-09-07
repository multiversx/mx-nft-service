import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { MarketplaceCollectionEntity } from './marketplace-collection.entity';

@Entity('marketplaces')
export class MarketplaceEntity extends BaseEntity {
  @Column({ length: 62 })
  @Index('marketplace_address')
  address: string;

  @Column({ length: 62 })
  name: string;

  @Column({ length: 20, unique: true })
  key: string;

  @Column()
  url: string;

  @Column({ length: 20 })
  type: MarketplaceTypeEnum;

  @Column({ nullable: true })
  acceptedPaymentTokens: string;

  @OneToMany(() => MarketplaceCollectionEntity, (collection) => collection.marketplace)
  collections: MarketplaceCollectionEntity[];

  @Column({ nullable: true })
  lastIndexTimestamp: number;

  constructor(init?: Partial<MarketplaceEntity>) {
    super();
    Object.assign(this, init);
  }
}
