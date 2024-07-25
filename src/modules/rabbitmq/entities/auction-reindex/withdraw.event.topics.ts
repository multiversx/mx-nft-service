import { Address } from '@multiversx/sdk-core';

export class WithdrawEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private nrAuctionTokens: string;
  private originalOwner: Address;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.nrAuctionTokens = parseInt(rawTopics[4], 16).toString();
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'hex'));
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
    };
  }
}
