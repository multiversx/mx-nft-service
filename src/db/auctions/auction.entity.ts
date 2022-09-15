import {
  AuctionTypeEnum,
  AuctionStatusEnum,
  AuctionAbi,
  ExternalAuctionAbi,
  ElrondSwapAuctionTypeEnum,
  SwapAbi,
} from 'src/modules/auctions/models';
import { DateUtils } from 'src/utils/date-utils';
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
  @Index('auction_collection')
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
  @Index('auction_start_date')
  startDate: number;

  @Column()
  @Index('auction_end_date')
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
    if (!auction) {
      return null;
    }
    return new AuctionEntity({
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
    });
  }

  static fromExternalAuctionAbi(
    auctionId: number,
    auction: ExternalAuctionAbi,
    tags: string,
    hash: string,
    marketplaceKey: string,
  ) {
    if (!auction) return null;
    return new AuctionEntity({
      marketplaceAuctionId: auctionId,
      collection: auction.auctioned_token_type.toString(),
      nonce: parseInt(auction.auctioned_token_nonce.valueOf().toString()),
      nrAuctionedTokens: parseInt(
        auction.nr_auctioned_tokens.valueOf().toString(),
      ),
      status: AuctionStatusEnum.Running,
      type: AuctionTypeEnum[auction.auction_type.valueOf().name],
      paymentToken: auction.payment_token_type.toString(),
      paymentNonce: parseInt(auction.payment_token_nonce.valueOf().toString()),
      ownerAddress: auction.original_owner.valueOf().toString(),
      minBid: auction.min_bid.valueOf().toString(),
      // minBidDiff: auction.min_bid_diff.valueOf().toString(),
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
      identifier: `${auction.auctioned_token_type.toString()}-${nominateVal(
        parseInt(auction.auctioned_token_nonce.valueOf().toString()),
      )}`,
      tags: tags ? `,${tags},` : '',
      blockHash: hash,
      marketplaceKey: marketplaceKey,
    });
  }

  static fromSwapAbi(
    auctionId: number,
    auction: SwapAbi,
    tags: string,
    hash: string,
    marketplaceKey: string,
  ) {
    if (!auction) return null;
    return new AuctionEntity({
      marketplaceAuctionId: auctionId,
      collection: auction.token.token_type.toString(),
      nonce: parseInt(auction.token.nonce.valueOf().toString()),
      nrAuctionedTokens: parseInt(auction.nr_tokens.valueOf().toString()),
      status: AuctionStatusEnum.Running,
      type:
        parseInt(auction.swap_type) === ElrondSwapAuctionTypeEnum.Auction
          ? AuctionTypeEnum.Nft
          : AuctionTypeEnum.SftOnePerPayment,
      paymentToken: auction.payment_token.token_type.toString(),
      paymentNonce: parseInt(auction.payment_token.nonce.valueOf().toString()),
      ownerAddress: auction.original_owner.valueOf().toString(),
      minBid: auction.min_bid.valueOf().toString(),
      // minBidDiff: auction.min_bid_diff.valueOf().toString(),
      minBidDenominated: parseFloat(
        denominate({
          input: auction.min_bid.valueOf()?.toString(),
          denomination: 18,
          decimals: 2,
          showLastNonZeroDecimal: true,
        }).replace(',', ''),
      ),
      maxBid:
        parseInt(auction.swap_type) === ElrondSwapAuctionTypeEnum.Buy
          ? auction.swap_type.price
          : '0',
      maxBidDenominated: parseFloat(
        denominate({
          input:
            parseInt(auction.swap_type) === ElrondSwapAuctionTypeEnum.Buy
              ? auction.swap_type.price
              : '0',
          denomination: 18,
          decimals: 2,
          showLastNonZeroDecimal: true,
        }).replace(',', ''),
      ),
      startDate: DateUtils.getCurrentTimestamp(),
      endDate: parseInt(auction.deadline.valueOf().toString()),
      identifier: `${auction.token.token_type.toString()}-${
        auction.token.nonce
      }`,
      tags: tags ? `,${tags},` : '',
      blockHash: hash,
      marketplaceKey: marketplaceKey,
    });
  }

  static fromWithdrawTopics(
    topicsAuctionToken: {
      originalOwner: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: string;
      price: string;
      paymentToken: string;
      paymentTokenNonce: string;
      auctionType: string;
      deadline: number;
    },
    tags: string,
    hash: string,
    marketplaceKey: string,
  ) {
    if (!topicsAuctionToken) {
      return null;
    }
    return new AuctionEntity({
      marketplaceAuctionId: parseInt(topicsAuctionToken.auctionId, 16),
      collection: topicsAuctionToken.collection,
      nonce: parseInt(topicsAuctionToken.nonce, 16),
      nrAuctionedTokens: parseInt(topicsAuctionToken.nrAuctionTokens, 16),
      status: AuctionStatusEnum.Running,
      type:
        topicsAuctionToken.auctionType === '' ||
        parseInt(topicsAuctionToken.auctionType) ===
          ElrondSwapAuctionTypeEnum.Auction
          ? AuctionTypeEnum.Nft
          : AuctionTypeEnum.SftOnePerPayment,
      paymentToken: topicsAuctionToken.paymentToken,
      paymentNonce: parseInt(topicsAuctionToken.paymentTokenNonce),
      ownerAddress: topicsAuctionToken.originalOwner,
      minBid: topicsAuctionToken.price,
      // minBidDiff: auction.min_bid_diff.valueOf().toString(),
      minBidDenominated: parseFloat(
        denominate({
          input: topicsAuctionToken.price?.toString(),
          denomination: 18,
          decimals: 2,
          showLastNonZeroDecimal: true,
        }).replace(',', ''),
      ),
      maxBid:
        parseInt(topicsAuctionToken.auctionType) ===
        ElrondSwapAuctionTypeEnum.Buy
          ? topicsAuctionToken.price
          : '0',
      maxBidDenominated: parseFloat(
        denominate({
          input:
            parseInt(topicsAuctionToken.auctionType) ===
            ElrondSwapAuctionTypeEnum.Buy
              ? topicsAuctionToken.price
              : '0',
          denomination: 18,
          decimals: 2,
          showLastNonZeroDecimal: true,
        }).replace(',', ''),
      ),
      startDate: DateUtils.getCurrentTimestamp(),
      endDate: topicsAuctionToken.deadline,
      identifier: `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`,
      tags: tags ? `,${tags},` : '',
      blockHash: hash,
      marketplaceKey: marketplaceKey,
    });
  }
}
