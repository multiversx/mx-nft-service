import { Address } from '@multiversx/sdk-core';

export class WithdrawEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private nrAuctionTokens: string;
  private originalOwner: Address;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrAuctionTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16).toString();
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'base64'));
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
    };
  }
}
