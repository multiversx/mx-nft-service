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

  @Column('decimal', { precision: 6, scale: 3 })
  score_openRarity: number;
  @Column()
  rank_openRarity: number;

  @Column('decimal', { precision: 6, scale: 3 })
  score_jaccardDistances: number;
  @Column()
  rank_jaccardDistances: number;

  @Column('decimal', { precision: 6, scale: 3 })
  score_trait: number;
  @Column()
  rank_trait: number;

  @Column('decimal', { precision: 6, scale: 3 })
  score_statistical: number;
  @Column()
  rank_statistical: number;

  constructor(init?: Partial<NftRarityEntity>) {
    super();
    Object.assign(this, init);
  }
}
