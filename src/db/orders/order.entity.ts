import { AccountEntity } from 'src/db/accounts/account.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuctionEntity } from '../auctions/auction.entity';

@Entity('Orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  orderId: number;

  @Column({ length: 25 })
  priceTokenIdentifier: string;

  @Column({ length: 25 })
  priceAmount: string;

  @Column({ length: 25 })
  priceNonce: string;

  @Column({ length: 25 })
  status: string; //enum

  @Column('date')
  creationDate: Date;

  @ManyToOne(() => AccountEntity, (account) => account.orders)
  @JoinColumn()
  from: AccountEntity;

  @ManyToOne(() => AuctionEntity, (account) => account.orders)
  @JoinColumn()
  auction: AuctionEntity;
}
