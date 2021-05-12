import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderStatusType } from './order-status.enum';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'price_token_identifier' })
  priceTokenIdentifier: string;

  @Column({ name: 'price_amount' })
  priceAmount: string;

  @Column({ name: 'price_nonce' })
  priceNonce: string;

  @Column()
  status: OrderStatusType;

  @Column({ name: 'creation_date', type: 'datetime' })
  creationDate: Date = new Date(new Date().toUTCString());

  @Column({ name: 'modified_date', type: 'datetime' })
  modifieDate: Date = new Date(new Date().toUTCString());

  @Column({ name: 'owner_address', length: 62 })
  ownerAddress: string;

  @Column({ name: 'auction_id' })
  auctionId: number;

  constructor(init?: Partial<OrderEntity>) {
    Object.assign(this, init);
  }
}
