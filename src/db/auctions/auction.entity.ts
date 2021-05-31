import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuctionStatusEnum } from '../../modules/auctions/models/Auction-status.enum';
import { BaseEntity } from '../base-entity';

@Entity('auctions')
export class AuctionEntity extends BaseEntity {
  @Column({ name: 'token_identifier', length: 20 })
  tokenIdentifier: string;

  @Column({ name: 'token_nonce' })
  tokenNonce: number;

  @Column()
  status: AuctionStatusEnum;

  @Column({ name: 'payment_token_identifier', length: 20 })
  paymentTokenIdentifier: string;

  @Column({ name: 'payment_nonce' })
  paymentNonce: number;

  @Column({ name: 'owner_address', length: 62 })
  ownerAddress: string;

  @Column({ name: 'min_bid' })
  minBid: string;

  @Column({ name: 'max_bid' })
  maxBid: string;

  @Column({ name: 'start_date' })
  startDate: string;

  @Column({ name: 'end_date' })
  endDate: string;

  constructor(init?: Partial<AuctionEntity>) {
    super();
    Object.assign(this, init);
  }
}
