import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('assets_likes')
export class AssetLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'token', length: 25 })
  @Index()
  token: string;

  @Column({ name: 'nonce' })
  @Index()
  nonce: number;

  @Column({ length: 62 })
  address: string;

  constructor(init?: Partial<AssetLikeEntity>) {
    Object.assign(this, init);
  }
}