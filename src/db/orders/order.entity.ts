import { Column, Entity } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models/order-status.enum';
import { BaseEntity } from '../base-entity';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({ name: 'price_token' })
  priceToken: string;

  @Column({ name: 'price_amount' })
  priceAmount: string;

  @Column({ name: 'price_nonce' })
  priceNonce: number;

  @Column()
  status: OrderStatusEnum;

  @Column({ name: 'owner_address', length: 62 })
  ownerAddress: string;

  @Column({ name: 'auction_id' })
  auctionId: number;

  constructor(init?: Partial<OrderEntity>) {
    super();
    Object.assign(this, init);
  }
}
