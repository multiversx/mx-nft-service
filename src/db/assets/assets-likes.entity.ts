import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('assets_likes')
export class AssetLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'token_identifier', length: 17 })
  @Index()
  tokenIdentifier: string;

  @Column({ name: 'token_nonce' })
  @Index()
  tokenNonce: number;

  @Column({ length: 62 })
  address: string;

  constructor(init?: Partial<AssetLikeEntity>) {
    Object.assign(this, init);
  }
}