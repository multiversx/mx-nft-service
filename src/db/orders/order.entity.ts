import { Column, Entity, Index } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models/order-status.enum';
import { BaseEntity } from '../base-entity';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column()
  priceToken: string;

  @Column()
  priceAmount: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  priceAmountDenominated: number;

  @Column()
  priceNonce: number;

  @Column()
  status: OrderStatusEnum;

  @Column({ length: 62 })
  ownerAddress: string;

  @Column({ nullable: true })
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
