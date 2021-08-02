import {
  AuctionTypeEnum,
  AuctionStatusEnum,
  AuctionAbi,
} from 'src/modules/auctions/models';
import { nominateVal } from 'src/modules/formatters';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('auctions')
export class AuctionEntity extends BaseEntity {
  @Column({ length: 20 })
  collection: string;

  @Column()
  nrAuctionedTokens: number;

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
    super();
    Object.assign(this, init);
  }

  static fromAuctionAbi(auctionId: number, auction: AuctionAbi) {
    return auction
      ? new AuctionEntity({
          id: auctionId,
          collection: auction.auctioned_token.token_type.valueOf().toString(),
          nonce: parseInt(auction.auctioned_token.nonce.valueOf().toString()),
          nrAuctionedTokens: parseInt(
            auction.nr_auctioned_tokens.valueOf().toString(),
          ),
          status: AuctionStatusEnum.Running,
          type: AuctionTypeEnum[auction.auction_type.valueOf().toString()],
          paymentToken: auction.payment_token.token_type.valueOf().toString(),
          paymentNonce: parseInt(
            auction.payment_token.nonce.valueOf().toString(),
          ),
          ownerAddress: auction.original_owner.valueOf().toString(),
          minBid: auction.min_bid.valueOf().toString(),
          maxBid: auction.max_bid?.valueOf()?.toString() || '0',
          startDate: auction.start_time.valueOf().toString(),
          endDate: auction.deadline.valueOf().toString(),
          identifier: `${auction.auctioned_token.token_type
            .valueOf()
            .toString()}-${nominateVal(
            parseInt(auction.auctioned_token.nonce.valueOf().toString()),
          )}`,
        })
      : null;
  }
}
