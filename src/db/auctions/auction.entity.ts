import { AccountEntity } from 'src/db/accounts/account.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from 'src/db/orders/order.entity';

@Entity('auctions')
export class AuctionEntity {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ name: 'token_identifier', length: 20 })
  tokenIdentifier: string;

  @Column({ name: 'owner_address', length: 62 })
  ownerAddress: string;

  @Column({ name: 'min_bid' })
  minBid: string;

  @Column({ name: 'max_bid' })
  maxBid: string;

  @Column({ name: 'creation_date' })
  creationDate: Date;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @ManyToOne(() => AccountEntity, (account) => account.orders)
  owner: AccountEntity;
}
