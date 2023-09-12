import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AcceptOfferEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: number;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[14])?.toString() ?? '0');
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
    };
  }
}
