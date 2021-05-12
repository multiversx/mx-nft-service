import { AccountEntity } from 'src/db/accounts/account.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuctionEntity } from '../auctions/auction.entity';
import { OrderStatusType } from './order-status.enum';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  orderId: number;

  @Column()
  priceTokenIdentifier: string;

  @Column()
  priceAmount: string;

  @Column()
  priceNonce: string;

  @Column()
  status: OrderStatusType;

  @Column('date')
  creationDate: Date = new Date(new Date().toUTCString());

  @Column()
  accountAddress: string;

  @Column()
  auctionId: number;

  constructor(init?: Partial<OrderEntity>) {
    Object.assign(this, init);
  }
}
