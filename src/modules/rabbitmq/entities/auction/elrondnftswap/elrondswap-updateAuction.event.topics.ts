import { Address } from '@multiversx/sdk-core';
import { NumberUtils } from '@multiversx/sdk-nestjs';

export class ElrondSwapUpdateTopics {
  private auctionId: string;
  private collection: string;
  private nonce: string;
  private nrAuctionTokens: number;
  private seller: Address;
  private price: string;
  private deadline: number;

  constructor(rawTopics: string[]) {
    this.auctionId = Buffer.from(rawTopics[1], 'base64').toString('hex');
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrAuctionTokens = parseInt(
      Buffer.from(rawTopics[4], 'base64').toString('hex'),
      16,
    );
    this.seller = new Address(Buffer.from(rawTopics[5], 'base64'));
    this.price = Buffer.from(rawTopics[6], 'base64')
      .toString('hex')
      .hexBigNumberToString();
    this.deadline = parseInt(NumberUtils.numberDecode(rawTopics[9] ?? '00'));
  }

  toPlainObject() {
    return {
      seller: this.seller.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      price: this.price,
      deadline: this.deadline,
    };
  }
}
