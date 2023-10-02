import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { MarketplaceEntity } from '.';

@Entity('marketplace-collections')
export class MarketplaceCollectionEntity extends BaseEntity {
  @Column({ length: 20 })
  @Index('marketplace_collection')
  collectionIdentifier: string;

  @Column({ length: 20 })
  collectionName: string;

  @ManyToMany(() => MarketplaceEntity, (marketplace) => marketplace.collections)
  marketplaces: MarketplaceEntity[];

  constructor(init?: Partial<MarketplaceCollectionEntity>) {
    super();
    Object.assign(this, init);
  }
}
