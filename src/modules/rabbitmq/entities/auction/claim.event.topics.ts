import { Address } from '@multiversx/sdk-core';

export class ClaimEventsTopics {
  private currentWinner: Address;
  private collection: string;
  private nonce: string;
  private bid: string = '0';
  private auctionId: string;
  private boughtTokens: string = '1';
  private paymentToken: string;

  constructor(rawTopics: string[]) {
    this.currentWinner = new Address(Buffer.from(rawTopics[1], 'base64'));
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
  }

  toPlainObject() {
    return {
      currentWinner: this.currentWinner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      boughtTokens: this.boughtTokens,
      bid: this.bid,
      paymentToken: this.paymentToken,
    };
  }
}
