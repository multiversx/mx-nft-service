import { BaseEntity } from 'src/db/base-entity';
import { MarketplaceEventAndTransactionData } from 'src/modules/marketplaces/models/marketplaceEventAndTxData.dto';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('marketplace_events')
@Unique('MarketplaceEventsEntity_UQ_EVENT', ['txHash', 'eventOrder', 'isTx'])
export class MarketplaceEventsEntity extends BaseEntity {
  @Column({ length: 64 })
  txHash: string;

  @Column({ length: 64, nullable: true })
  originalTxHash?: string;

  @Index('marketplace_address')
  @Column({ length: 62 })
  marketplaceAddress: string;

  @Column()
  timestamp: number;

  @Column()
  eventOrder: number = -1;

  @Column()
  isTx: boolean = false;

  @Column({
    type: 'json',
  })
  data: MarketplaceEventAndTransactionData;

  constructor(init?: Partial<MarketplaceEventsEntity>) {
    super();
    Object.assign(this, init);
  }
}
