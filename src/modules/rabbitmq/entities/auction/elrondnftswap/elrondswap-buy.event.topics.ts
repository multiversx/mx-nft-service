import { Address } from '@multiversx/sdk-core';

export class ElrondSwapBuyTopics {
  private auctionId: string;
  private collection: string;
  private nonce: string;
  private boughtTokens: string;
  private currentWinner: Address;
  private bid: string;
  private paymentToken: string;

  constructor(rawTopics: string[]) {
    this.auctionId = Buffer.from(rawTopics[1], 'base64').toString('hex');
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.boughtTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16).toString();
    this.bid = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
    this.currentWinner = new Address(Buffer.from(rawTopics[9], 'base64'));
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
