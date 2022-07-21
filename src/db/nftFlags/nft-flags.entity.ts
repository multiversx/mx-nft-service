import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('nft_flags')
export class NftFlagsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  @Index()
  @Unique('nft_flags_identifier', ['identifier'])
  identifier: string;

  @Column('decimal', { precision: 6, scale: 2 })
  nsfw: number;

  constructor(init?: Partial<NftFlagsEntity>) {
    Object.assign(this, init);
  }
}
