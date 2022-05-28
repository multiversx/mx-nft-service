import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('featured_marketplaces')
export class FeaturedMarketplaceEntity extends BaseEntity {
  @Column({ length: 62 })
  @Index('marketplace_address')
  address: string;

  @Column({ length: 62 })
  name: string;

  @Column()
  url: string;

  constructor(init?: Partial<FeaturedMarketplaceEntity>) {
    super();
    Object.assign(this, init);
  }
}
