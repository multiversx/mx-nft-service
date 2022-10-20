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

  // values between 0 - infinity
  @Column('decimal', { precision: 10, scale: 3 })
  score_openRarity: number;
  @Column()
  rank_openRarity: number;

  // values between 0-100
  @Column('decimal', { precision: 6, scale: 3 })
  score_jaccardDistances: number;
  @Column()
  rank_jaccardDistances: number;

  // values between 0 - infinity
  @Column('decimal', { precision: 10, scale: 3 })
  score_trait: number;
  @Column()
  rank_trait: number;

  // values between 0 - 1
  @Column('decimal', { precision: 19, scale: 18 })
  score_statistical: number;
  @Column()
  rank_statistical: number;

  constructor(init?: Partial<NftRarityEntity>) {
    super();
    Object.assign(this, init);
  }
}
