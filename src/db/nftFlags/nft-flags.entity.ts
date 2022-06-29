import { float } from 'aws-sdk/clients/lightsail';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('nft_flags')
@Unique('NftFlagsEntity_UQ_Flag', ['identifier', 'nsfw'])
export class NftFlagsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  @Index()
  identifier: string;

  @Column('decimal')
  nsfw: float;

  constructor(init?: Partial<NftFlagsEntity>) {
    Object.assign(this, init);
  }
}
