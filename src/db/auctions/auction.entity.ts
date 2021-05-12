import { AccountEntity } from 'src/db/accounts/account.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @ManyToOne(() => AccountEntity, (account) => account.orders)
  owner: AccountEntity;
}
