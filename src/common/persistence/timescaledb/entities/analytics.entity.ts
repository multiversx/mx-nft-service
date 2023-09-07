import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('hyper_nfts_analytics')
export class XNftsAnalyticsEntity {
  @PrimaryColumn({ nullable: false, type: 'timestamp without time zone' })
  timestamp: Date;

  @PrimaryColumn({ nullable: false, type: 'varchar' })
  series: string;

  @PrimaryColumn({ nullable: false, type: 'varchar' })
  key: string;

  @Column({
    type: 'decimal',
    precision: 128,
    scale: 64,
    default: 0,
    nullable: false,
  })
  value = '0';

  @Column({ nullable: false, type: 'varchar' })
  paymentToken: string;

  @Column({ nullable: false, type: 'varchar' })
  marketplaceKey: string;

  constructor(init?: Partial<XNftsAnalyticsEntity>) {
    Object.assign(this, init);
  }

  public static fromObject(timestamp: Date, object: Record<string, Record<string, string>>): XNftsAnalyticsEntity[] {
    const entities = Object.entries(object)
      .map(([series, record]: [string, Record<string, string>]) => XNftsAnalyticsEntity.fromRecord(timestamp, record, series))
      .flat(1);
    return entities;
  }

  private static fromRecord(timestamp: Date, record: Record<string, string>, series?: string): XNftsAnalyticsEntity[] {
    const entities = Object.entries(record).map(([key, value]) => {
      const entity = new XNftsAnalyticsEntity();
      entity.timestamp = timestamp;
      entity.series = series;
      entity.key = key;
      entity.value = value;
      return entity;
    });
    return entities;
  }
}
