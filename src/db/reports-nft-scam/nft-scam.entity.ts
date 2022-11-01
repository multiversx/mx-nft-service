import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('nft_scams')
@Unique('NftScamEntity_UQ_SCAM', ['identifier'])
export class NftScamEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  @Index()
  identifier: string;

  @Column({ length: 20 })
  version: string;

  @Column({ nullable: true, length: 20 })
  type: string;

  @Column({ nullable: true, length: 50 })
  info: string;

  constructor(init?: Partial<NftScamEntity>) {
    Object.assign(this, init);
  }
}
