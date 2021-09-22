import { Column, Entity } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models/order-status.enum';
import { BaseEntity } from '../base-entity';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column()
  priceToken: string;

  @Column()
  priceAmount: string;

  @Column('decimal', { precision: 18, scale: 2, default: 0.0 })
  priceAmountDenominated: number;

  @Column()
  priceNonce: number;

  @Column()
  status: OrderStatusEnum;

  @Column({ length: 62 })
  ownerAddress: string;

  @Column()
  auctionId: number;

  constructor(init?: Partial<OrderEntity>) {
    super();
    Object.assign(this, init);
  }
}
