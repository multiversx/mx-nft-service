import {
  AuctionTypeEnum,
  AuctionStatusEnum,
} from 'src/modules/auctions/models';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auctions')
export class AuctionEntity {
  @PrimaryColumn({ unique: true })
  id: number;

  @Column({ nullable: true })
  creationDate: Date;

  @Column({ nullable: true })
  modifiedDate: Date;

  @Column({ length: 20 })
  token: string;

  @Column({ length: 30 })
  identifier: string;

  @Column()
  nonce: number;

  @Column()
  status: AuctionStatusEnum;

  @Column()
  type: AuctionTypeEnum;

  @Column({ length: 20 })
  paymentToken: string;

  @Column()
  paymentNonce: number;

  @Column({ length: 62 })
  ownerAddress: string;

  @Column()
  minBid: string;

  @Column()
  maxBid: string;

  @Column()
  startDate: string;

  @Column()
  endDate: string;

  constructor(init?: Partial<AuctionEntity>) {
    Object.assign(this, init);
  }
}
