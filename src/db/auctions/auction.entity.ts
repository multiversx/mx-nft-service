import {
  AuctionTypeEnum,
  AuctionStatusEnum,
} from 'src/modules/auctions/models';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auctions')
export class AuctionEntity {
  @PrimaryColumn({ unique: true })
  id: number;

  @Column({ name: 'creation_date' })
  creationDate: Date = new Date(new Date().toUTCString());

  @Column({ name: 'modified_date', nullable: true })
  modifiedDate: Date;

  @Column({ name: 'token_identifier', length: 20 })
  tokenIdentifier: string;

  @Column({ name: 'token_nonce' })
  tokenNonce: number;

  @Column()
  status: AuctionStatusEnum;

  @Column()
  type: AuctionTypeEnum;

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
    Object.assign(this, init);
  }
}
