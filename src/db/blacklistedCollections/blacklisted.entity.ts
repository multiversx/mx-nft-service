import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('blacklisted_collections')
@Unique('BlacklistedCollections_UQ_Entry', ['identifier'])
export class BlacklistedCollectionEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 25 })
  @Index()
  identifier: string;

  constructor(init?: Partial<BlacklistedCollectionEntity>) {
    Object.assign(this, init);
  }
}
