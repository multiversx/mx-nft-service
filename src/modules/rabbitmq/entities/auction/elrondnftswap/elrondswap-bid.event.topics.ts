import { Address } from '@multiversx/sdk-core';

export class ElrondSwapBidEventsTopics {
  private auctionId: string;
  private collection: string;
  private nonce: string;
  private nrAuctionTokens: string;
  private currentWinner: Address;
  private currentBid: string;

  constructor(rawTopics: string[]) {
    this.auctionId = Buffer.from(rawTopics[1], 'base64').toString('hex');
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrAuctionTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16).toString();
    this.currentWinner = new Address(Buffer.from(rawTopics[9], 'base64'));
    this.currentBid = Buffer.from(rawTopics[10], 'base64').toString('hex').hexBigNumberToString();
  }

  toPlainObject() {
    return {
      currentWinner: this.currentWinner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      currentBid: this.currentBid,
    };
  }
}
