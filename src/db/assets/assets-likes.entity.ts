import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('assets_likes')
@Unique('AssetLikeEntity_UQ_LIKE', ['identifier', 'address'])
export class AssetLikeEntity extends BaseEntity {
  @Column({ length: 25 })
  @Index()
  identifier: string;

  @Column({ length: 62 })
  address: string;

  constructor(init?: Partial<AssetLikeEntity>) {
    super();
    Object.assign(this, init);
  }
}
