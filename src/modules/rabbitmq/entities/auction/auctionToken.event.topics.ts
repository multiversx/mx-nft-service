import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AuctionTokenEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private nrAuctionTokens: string;
  private originalOwner: Address;
  private minBid: string;
  private maxBid: string;
  private startTime: number;
  private endTime: number;
  private paymentToken: string;
  private paymentNonce: number;
  private auctionType: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrAuctionTokens = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16).toString();
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'base64'));

    this.minBid = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(rawTopics[6])).toString();
    this.maxBid = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(rawTopics[7])).toString();
    this.startTime = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(rawTopics[8]));
    this.endTime = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(rawTopics[9]));
    this.paymentToken = BinaryUtils.base64Decode(rawTopics[10]);
    this.paymentNonce = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(rawTopics[11]));
    this.auctionType = BinaryUtils.hexToNumber(BinaryUtils.base64ToHex(rawTopics[12])).toString();

    if (this.startTime.toString().length > 10) {
      this.startTime = parseInt(this.startTime.toString().substring(0, 10));
    }
    if (this.endTime.toString().length > 10) {
      this.endTime = parseInt(this.endTime.toString().substring(0, 10));
    }
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      nrAuctionTokens: this.nrAuctionTokens,
      minBid: this.minBid,
      price: this.minBid,
      maxBid: this.maxBid,
      startTime: this.startTime,
      endTime: this.endTime,
      paymentToken: this.paymentToken,
      paymentNonce: this.paymentNonce,
      auctionType: this.auctionType,
    };
  }
}
