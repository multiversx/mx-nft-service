import { AccountEntity } from 'src/accounts/account.entity';
import { AuctionEntity } from 'src/auctions/auction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
