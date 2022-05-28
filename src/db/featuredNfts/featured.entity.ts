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
  @Index()
  identifier: string;

  constructor(init?: Partial<FeaturedCollectionEntity>) {
    Object.assign(this, init);
  }
}
