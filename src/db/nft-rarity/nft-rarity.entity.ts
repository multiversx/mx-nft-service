import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('nft_rarities')
@Unique('NftRarityEntity_UQ_RARITY', ['collection', 'identifier'])
export class NftRarityEntity extends BaseEntity {
  @Index('rarity_collection')
  @Column({ length: 20 })
  collection: string;

  @Column({ length: 30 })
  @Index('rarity_identifier')
  identifier: string;

  @Column()
  nonce: number;

  // manual
  @Column('decimal', { precision: 6, scale: 3 })
  score: number;
  @Column()
  rank: number;

  @Column('decimal', { precision: 6, scale: 3 })
  opScore: number;
  @Column()
  opRank: number;

  @Column('decimal', { precision: 6, scale: 3 })
  jdScore: number;
  @Column()
  jdRank: number;

  @Column('decimal', { precision: 6, scale: 3 })
  trScore: number;
  @Column()
  trRank: number;

  @Column('decimal', { precision: 6, scale: 3 })
  srScore: number;
  @Column()
  srRank: number;

  constructor(init?: Partial<NftRarityEntity>) {
    super();
    Object.assign(this, init);
  }
}
