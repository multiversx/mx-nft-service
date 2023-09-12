import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class UpdateListingEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private ownerAddress: Address;
  private oldPrice: string;
  private newBid: string;
  private paymentToken: string;
  private paymentTokenNonce: string;
  private deadline: number = 0;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.ownerAddress = new Address(Buffer.from(rawTopics[4], 'base64'));
    this.oldPrice = Buffer.from(rawTopics[5], 'base64').toString('hex').hexBigNumberToString();
    this.newBid = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
    this.paymentToken = BinaryUtils.base64Decode(rawTopics[7]);
    this.paymentTokenNonce = BinaryUtils.tryBase64ToBigInt(rawTopics[8])?.toString() ?? '0';
    this.deadline = parseInt(Buffer.from(rawTopics[9] ?? '0', 'base64').toString('hex'), 16);
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      ownerAddress: this.ownerAddress,
      oldPrice: this.oldPrice,
      newBid: this.newBid,
      paymentToken: this.paymentToken,
      paymentTokenNonce: this.paymentTokenNonce,
      deadline: this.deadline,
    };
  }
}
