import { EventResponse } from 'src/common/services/elrond-communication/models/elastic-search/event.response';
import { BaseEntity } from 'src/db/base-entity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('marketplace_events')
@Unique('MarketplaceEventsEntity_UQ_EVENT', ['tx_hash', 'order'])
export class MarketplaceEventsEntity extends BaseEntity {
  @Column({ length: 64 })
  tx_hash: string;

  @Column()
  order: number;

  @Column({ length: 64, nullable: true })
  original_tx_hash?: string;

  @Index('marketplace_key')
  @Column({ length: 20 })
  marketplace_key: string;

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
