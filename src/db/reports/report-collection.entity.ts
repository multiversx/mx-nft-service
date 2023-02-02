import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('report_collections')
@Unique('ReportCollectionEntity_UQ_REPORT', ['collectionIdentifier', 'address'])
export class ReportCollectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  @Index()
  collectionIdentifier: string;

  @Column({ length: 62 })
  address: string;

  constructor(init?: Partial<ReportCollectionEntity>) {
    Object.assign(this, init);
  }
}
