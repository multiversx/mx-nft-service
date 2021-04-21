import { AccountEntity } from 'src/accounts/account.entity';
import { OrderEntity } from 'src/orders/order.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('Auction')
export class AuctionEntity {
  @PrimaryGeneratedColumn()
  auctionId: number;

  @Column({ length: 25 })
  assetId: string;

  @Column({ length: 25 })
  minBid: string;

  @Column({ length: 25 })
  maxBid: string;

  @Column('date')
  creationDate: Date;

  @Column('date')
  startDate: Date;

  @Column('date')
  endDate: Date;

  @OneToMany((type) => OrderEntity, (order) => order.auction) // note: we will create author property in the Photo class below
  orders: OrderEntity[];

  @ManyToOne(() => AccountEntity, (account) => account.orders)
  owner: AccountEntity;
}
