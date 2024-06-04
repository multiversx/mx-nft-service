export type BidEventType = {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  currentWinner: string;
  currentBid: string;
};

export type BuySftEventType = {
  collection: string;
  nonce: string;
  auctionId: string;
  currentWinner: string;
  currentBid: string;
};

export type WithdrawEventType = {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  originalOwner: string;
};

export type EndAuctionEventType = {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  currentWinner: string;
  currentBid: string;
};

export type AuctionTokenEventType = {
  collection: string;
  nonce: string;
  auctionId: string;
  nrAuctionTokens: string;
  currentWinner: string;
  currentBid: string;
};
