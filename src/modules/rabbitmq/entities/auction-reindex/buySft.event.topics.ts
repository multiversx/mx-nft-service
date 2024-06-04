import { Address } from '@multiversx/sdk-core';
import '../../../../utils/extensions';

export class BuySftEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private currentWinner: Address;
  private bid: string;
  private boughtTokens: string;
  private paymentToken: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'hex').toString();
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.boughtTokens = rawTopics[4].hexBigNumberToString();
    this.currentWinner = new Address(Buffer.from(rawTopics[5], 'hex'));
    this.bid = rawTopics[6].hexBigNumberToString();
    this.paymentToken = rawTopics[8];
  }

  toPlainObject() {
    return {
      currentWinner: this.currentWinner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      bid: this.bid,
      boughtTokens: this.boughtTokens,
      paymentToken: this.paymentToken,
    };
  }
}
