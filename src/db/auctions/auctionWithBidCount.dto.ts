import {
  AuctionTypeEnum,
  AuctionStatusEnum,
} from 'src/modules/auctions/models';

export class AuctionWithBidsCount {
  id: number;
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
  minBidDenominated: number;
  maxBid: string;
  maxBidDenominated: number;
  startDate: number;
  endDate: number;
  ordersCount: number;
  tags: string;
  blockHash: string;

  constructor(init?: Partial<AuctionWithBidsCount>) {
    Object.assign(this, init);
  }
}
