import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('artist_asset_info')
export class ArtistAssetsInfo extends BaseEntity {
  @Column({ length: 25 })
  @Index()
  identifier: string;

  @Column()
  coverImgUrl: string;

  constructor(init?: Partial<ArtistAssetsInfo>) {
    super();
    Object.assign(this, init);
  }
}
