import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('report_nfts')
@Unique('ReportNftEntity_UQ_REPORT', ['identifier', 'address'])
export class ReportNftEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  @Index()
  identifier: string;

  @Column({ length: 62 })
  address: string;

  constructor(init?: Partial<ReportNftEntity>) {
    Object.assign(this, init);
  }
}
