import { EventResponse } from 'src/common/services/mx-communication/models/elastic-search/event.response';
import { BaseEntity } from 'src/db/base-entity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('marketplace_events')
@Unique('MarketplaceEventsEntity_UQ_EVENT', ['txHash', 'order'])
export class MarketplaceEventsEntity extends BaseEntity {
  @Column({ length: 64 })
  txHash: string;

  @Column()
  order: number;

  @Column({ length: 64, nullable: true })
  originalTxHash?: string;

  @Index('marketplace_address')
  @Column({ length: 62 })
  marketplaceAddress: string;

  @Column()
  timestamp: number;

  @Column({
    type: 'json',
  })
  data: EventResponse;

  constructor(init?: Partial<MarketplaceEventsEntity>) {
    super();
    Object.assign(this, init);
  }
}
