import {
  AuctionTypeEnum,
  AuctionStatusEnum,
  AuctionAbi,
} from 'src/modules/auctions/models';
import denominate, { nominateVal } from 'src/modules/formatters';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('auctions')
export class AuctionEntity extends BaseEntity {
  @Column({ length: 20 })
  collection: string;

  @Column()
  nrAuctionedTokens: number;

  @Column({ length: 30 })
  @Index()
  identifier: string;

  @Column()
  nonce: number;

  @Column({ length: 10 })
  @Index('auction_status')
  status: AuctionStatusEnum;

  @Column()
  type: AuctionTypeEnum;

  @Column({ length: 20 })
  paymentToken: string;

  @Column()
  paymentNonce: number;

  @Column({ length: 62 })
  @Index('auction_owner')
  ownerAddress: string;

  @Column()
  minBid: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  minBidDenominated: number;
  @Column()
  maxBid: string;

  @Column('decimal', { precision: 36, scale: 18, default: 0.0 })
  maxBidDenominated: number;

  @Column()
  startDate: number;

  @Column()
  endDate: number;

  @Column()
  tags: string;

  @Column({ length: 64 })
  blockHash: string;

  constructor(init?: Partial<AuctionEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromAuctionAbi(
    auctionId: number,
    auction: AuctionAbi,
    tags: string,
    hash: string,
  ) {
    return auction
      ? new AuctionEntity({
          id: auctionId,
          collection: auction.auctioned_token.token_type.valueOf().toString(),
          nonce: parseInt(auction.auctioned_token.nonce.valueOf().toString()),
          nrAuctionedTokens: parseInt(
            auction.nr_auctioned_tokens.valueOf().toString(),
          ),
          status: AuctionStatusEnum.Running,
          type: AuctionTypeEnum[auction.auction_type.valueOf().name],
          paymentToken: auction.payment_token.token_type.valueOf().toString(),
          paymentNonce: parseInt(
            auction.payment_token.nonce.valueOf().toString(),
          ),
          ownerAddress: auction.original_owner.valueOf().toString(),
          minBid: auction.min_bid.valueOf().toString(),
          minBidDenominated: parseFloat(
            denominate({
              input: auction.min_bid.valueOf()?.toString(),
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }),
          ),
          maxBid: auction.max_bid?.valueOf()?.toString() || '0',
          maxBidDenominated: parseFloat(
            denominate({
              input: auction?.max_bid?.valueOf()?.toString() || '0',
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }),
          ),
          startDate: parseInt(auction.start_time.valueOf().toString()),
          endDate: parseInt(auction.deadline.valueOf().toString()),
          identifier: `${auction.auctioned_token.token_type
            .valueOf()
            .toString()}-${nominateVal(
            parseInt(auction.auctioned_token.nonce.valueOf().toString()),
          )}`,
          tags: tags ? `,${tags},` : '',
          blockHash: hash,
        })
      : null;
  }
}
