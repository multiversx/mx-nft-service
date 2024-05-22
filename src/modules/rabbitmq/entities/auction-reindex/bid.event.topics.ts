import { Address } from '@multiversx/sdk-core';
import '../../../../utils/extensions';

export class BidEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private nrAuctionTokens: string;
  private currentWinner: Address;
  private currentBid: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'hex').toString();
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.nrAuctionTokens = parseInt(rawTopics[4], 16).toString();
    this.currentWinner = new Address(Buffer.from(rawTopics[5], 'hex'));
    this.currentBid = rawTopics[6].hexBigNumberToString();
  }

  toPlainObject() {
    return {
      currentWinner: this.currentWinner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      currentBid: this.currentBid,
    };
  }
}
