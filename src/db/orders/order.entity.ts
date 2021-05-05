import { AccountEntity } from 'src/db/accounts/account.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuctionEntity } from '../auctions/auction.entity';

@Entity('Order')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  orderId: number;

  @Column({ length: 25 })
  price: string;

  @Column({ length: 25 })
  status: string;

  @Column('date')
  creationDate: Date;

  @ManyToOne(() => AccountEntity, (account) => account.orders)
  @JoinColumn()
  from: AccountEntity;

  @ManyToOne(() => AuctionEntity, (account) => account.orders)
  @JoinColumn()
  auction: AuctionEntity;
}
