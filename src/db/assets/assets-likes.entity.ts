import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('assets_likes')
@Unique('AssetLikeEntity_UQ_LIKE', ['identifier', 'address'])
export class AssetLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  @Index()
  identifier: string;

  @Column({ length: 62 })
  address: string;

  constructor(init?: Partial<AssetLikeEntity>) {
    Object.assign(this, init);
  }
}
