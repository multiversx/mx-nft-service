import { AccountEntity } from 'src/db/accounts/account.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auctions')
export class AuctionEntity {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ name: 'token_identifier', length: 20 })
  tokenIdentifier: string;

  @Column({ name: 'payment_token_identifier', length: 20 })
  paymentTokenIdentifier: string;

  @Column({ name: 'payment_nonce', length: 20 })
  paymentNonce: string;

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

  constructor(init?: Partial<AuctionEntity>) {
    Object.assign(this, init);
  }
}
