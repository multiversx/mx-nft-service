import { GenericEventType } from '../generic.types';

export type BidEventType = GenericEventType & {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  currentWinner: string;
  currentBid: string;
};

export type BuySftEventType = GenericEventType & {
  collection: string;
  nonce: string;
  auctionId: string;
  currentWinner: string;
  currentBid: string;
};

export type WithdrawEventType = GenericEventType & {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  originalOwner: string;
};

export type EndAuctionEventType = GenericEventType & {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  currentWinner: string;
  currentBid: string;
};

export type AuctionTokenEventType = GenericEventType & {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  currentWinner: string;
  currentBid: string;
};
