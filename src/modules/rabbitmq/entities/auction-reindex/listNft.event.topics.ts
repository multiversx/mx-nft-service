import { Address } from '@multiversx/sdk-core';
import { mxConfig } from 'src/config';

export class ListNftEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string = '0';
  private nrAuctionTokens: string = '1';
  private originalOwner: Address;
  private price: string;
  private paymentToken: string = mxConfig.egld;
  private paymentTokenNonce: string = '0';
  private auctionType: string = '';
  private deadline: number = 0;

  constructor(rawTopics: string[]) {
    this.originalOwner = new Address(Buffer.from(rawTopics[1], 'hex'));
    this.collection = Buffer.from(rawTopics[2], 'hex').toString();
    this.nonce = rawTopics[3];
    this.price = rawTopics[4].hexBigNumberToString();
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      price: this.price,
      paymentToken: this.paymentToken,
      paymentTokenNonce: this.paymentTokenNonce,
      auctionType: this.auctionType,
      deadline: this.deadline,
    };
  }
}
