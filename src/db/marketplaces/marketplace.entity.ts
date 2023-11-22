import { MarketplaceState, MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { MarketplaceCollectionEntity } from './marketplace-collection.entity';

@Entity('marketplaces')
export class MarketplaceEntity extends BaseEntity {
  @Column({ length: 62 })
  @Index('marketplace_address')
  address: string;

  @Column({ length: 62 })
  name: string;

  @Column({ length: 10 })
  state: MarketplaceState;

  @Column({ length: 62, unique: true })
  key: string;

  @Column()
  url: string;

  @Column({ length: 20 })
  type: MarketplaceTypeEnum;

  @Column({ nullable: true })
  acceptedPaymentTokens: string;

  @ManyToMany(() => MarketplaceCollectionEntity, (collection) => collection.marketplaces)
  @JoinTable()
  collections: MarketplaceCollectionEntity[];

  @Column({ nullable: true })
  lastIndexTimestamp: number;

  constructor(init?: Partial<MarketplaceEntity>) {
    super();
    Object.assign(this, init);
  }
}
