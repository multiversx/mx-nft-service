import { Address } from '@multiversx/sdk-core/out';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AuctionTokenEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private nrAuctionTokens: string;
  private originalOwner: string;
  private minBid: string;
  private maxBid: string;
  private startTime: number;
  private endTime: number;
  private paymentToken: string;
  private paymentNonce: number;
  private auctionType: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'hex').toString();
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.nrAuctionTokens = parseInt(rawTopics[4], 16).toString();
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'hex')).bech32();

    this.minBid = BinaryUtils.hexToNumber(rawTopics[6]).toString();
    this.maxBid = rawTopics[7] ? BinaryUtils.hexToNumber(rawTopics[7]).toString() : '0';
    this.startTime = BinaryUtils.hexToNumber(rawTopics[8]);
    this.endTime = rawTopics[9] ? parseInt(BinaryUtils.hexToNumber(rawTopics[9]).toString()) : 0;
    this.paymentToken = rawTopics[10].toString();
    this.paymentNonce = rawTopics[11] ? parseInt(BinaryUtils.hexToNumber(rawTopics[11]).toString()) : 0;
    this.auctionType = BinaryUtils.hexToNumber(rawTopics[12]).toString();

    if (this.startTime.toString().length > 10) {
      this.startTime = parseInt(this.startTime.toString().substring(0, 10));
    }
    if (this.endTime.toString().length > 10) {
      this.endTime = parseInt(this.endTime.toString().substring(0, 10));
    }
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner,
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
