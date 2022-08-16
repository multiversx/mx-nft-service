import {
  AuctionTypeEnum,
  AuctionStatusEnum,
  AuctionAbi,
} from 'src/modules/auctions/models';
import denominate, { nominateVal } from 'src/utils/formatters';
import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { OrderEntity } from '../orders';
import { TagEntity } from './tags.entity';

@Entity('auctions')
@Unique('AuctionEntity_UQ_Marketplace', [
  'marketplaceAuctionId',
  'marketplaceKey',
])
export class AuctionEntity extends BaseEntity {
  @Column()
  marketplaceAuctionId: number;

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
  minBidDiff: string;

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

  @Column({ length: 20 })
  @Index('auction_marketplace_key')
  marketplaceKey: string;

  @OneToMany(() => OrderEntity, (order) => order.auction)
  orders: OrderEntity[];
  @OneToMany(() => TagEntity, (tag) => tag.auction)
  tagEntities: TagEntity[];

  constructor(init?: Partial<AuctionEntity>) {
    super();
    Object.assign(this, init);
  }

  static fromAuctionAbi(
    auctionId: number,
    auction: AuctionAbi,
    tags: string,
    hash: string,
    marketplaceKey: string,
  ) {
    return auction
      ? new AuctionEntity({
          marketplaceAuctionId: auctionId,
          collection: auction.auctioned_tokens.token_identifier
            .valueOf()
            .toString(),
          nonce: parseInt(
            auction.auctioned_tokens.token_nonce.valueOf().toString(),
          ),
          nrAuctionedTokens: parseInt(
            auction.auctioned_tokens.amount.valueOf().toString(),
          ),
          status: AuctionStatusEnum.Running,
          type: AuctionTypeEnum[auction.auction_type.valueOf().name],
          paymentToken: auction.payment_token.valueOf().toString(),
          paymentNonce: parseInt(auction.payment_nonce.valueOf().toString()),
          ownerAddress: auction.original_owner.valueOf().toString(),
          minBid: auction.min_bid.valueOf().toString(),
          minBidDiff: auction.min_bid_diff.valueOf().toString(),
          minBidDenominated: parseFloat(
            denominate({
              input: auction.min_bid.valueOf()?.toString(),
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }).replace(',', ''),
          ),
          maxBid: auction.max_bid?.valueOf()?.toString() || '0',
          maxBidDenominated: parseFloat(
            denominate({
              input: auction?.max_bid?.valueOf()?.toString() || '0',
              denomination: 18,
              decimals: 2,
              showLastNonZeroDecimal: true,
            }).replace(',', ''),
          ),
          startDate: parseInt(auction.start_time.valueOf().toString()),
          endDate: parseInt(auction.deadline.valueOf().toString()),
          identifier: `${auction.auctioned_tokens.token_identifier
            .valueOf()
            .toString()}-${nominateVal(
            parseInt(auction.auctioned_tokens.token_nonce.valueOf().toString()),
          )}`,
          tags: tags ? `,${tags},` : '',
          blockHash: hash,
          marketplaceKey: marketplaceKey,
        })
      : null;
  }
}
