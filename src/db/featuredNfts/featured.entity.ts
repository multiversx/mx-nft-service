import { FeaturedCollectionTypeEnum } from 'src/modules/featured/FeatureCollectionType.enum';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('featured_nfts')
export class FeaturedNftEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 25 })
  @Index()
  identifier: string;

  constructor(init?: Partial<FeaturedNftEntity>) {
    Object.assign(this, init);
  }
}

@Entity('featured_collections')
@Unique('FeaturedCollections_UQ_Entry', ['identifier', 'type'])
export class FeaturedCollectionEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 25 })
  @Index()
  identifier: string;
  @Column({ length: 25 })
  @Index()
  type: FeaturedCollectionTypeEnum;

  constructor(init?: Partial<FeaturedCollectionEntity>) {
    Object.assign(this, init);
  }
}
