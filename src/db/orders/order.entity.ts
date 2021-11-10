import { Column, Entity, Index } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models/order-status.enum';
import { BaseEntity } from '../base-entity';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({ length: 20 })
  priceToken: string;

  @Column({ length: 62 })
  priceAmount: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  priceAmountDenominated: number;

  @Column()
  priceNonce: number;

  @Column({ length: 8 })
  @Index('order_status')
  status: OrderStatusEnum;

  @Column({ length: 62 })
  ownerAddress: string;

  @Column({ nullable: true, length: 62 })
  boughtTokensNo: string;

  @Column()
  @Index('order_auction_id')
  auctionId: number;

  @Column({ length: 64 })
  blockHash: string;

  constructor(init?: Partial<OrderEntity>) {
    super();
    Object.assign(this, init);
  }
}
