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

  @Column('decimal', { precision: 6, scale: 3 })
  score: number;

  @Column()
  nonce: number;

  @Column()
  rank: number;

  constructor(init?: Partial<NftRarityEntity>) {
    super();
    Object.assign(this, init);
  }
}
