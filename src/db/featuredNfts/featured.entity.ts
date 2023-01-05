import { FeaturedCollectionTypeEnum } from 'src/modules/featured/FeatureCollectionType.enum';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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
export class FeaturedCollectionEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 25 })
  @Index({ unique: true })
  identifier: string;
  @Column({ length: 25 })
  @Index()
  type: FeaturedCollectionTypeEnum;

  constructor(init?: Partial<FeaturedCollectionEntity>) {
    Object.assign(this, init);
  }
}
