import { AuctionTypeEnum, AuctionStatusEnum } from 'src/modules/auctions/models';

export class AuctionWithBidsCount {
  id: number;
  marketplaceAuctionId: number;
  creationDate: Date = new Date(new Date().toUTCString());
  modifiedDate: Date;
  collection: string;
  nrAuctionedTokens: number;
  identifier: string;
  nonce: number;
  status: AuctionStatusEnum;
  type: AuctionTypeEnum;
  paymentToken: string;
  paymentNonce: number;
  ownerAddress: string;
  minBid: string;
  minBidDiff: string;
  minBidDenominated: number;
  maxBid: string;
  maxBidDenominated: number;
  startDate: number;
  endDate: number;
  ordersCount: number;
  tags: string;
  blockHash: string;
  marketplaceKey: string;

  constructor(init?: Partial<AuctionWithBidsCount>) {
    Object.assign(this, init);
  }
}

export class AuctionWithStartBid {
  id: number;
  marketplaceAuctionId: number;
  creationDate: Date;
  modifiedDate: Date;
  collection: string;
  nrAuctionedTokens: number;
  identifier: string;
  nonce: number;
  status: AuctionStatusEnum;
  type: AuctionTypeEnum;
  paymentToken: string;
  paymentNonce: number;
  ownerAddress: string;
  minBid: string;
  minBidDiff: string;
  minBidDenominated: number;
  maxBid: string;
  maxBidDenominated: number;
  startDate: number;
  endDate: number;
  startBid: number;
  tags: string;
  blockHash: string;
  marketplaceKey: string;

  constructor(init?: Partial<AuctionWithStartBid>) {
    Object.assign(this, init);
  }
}
