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
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.ownerAddress = new Address(Buffer.from(rawTopics[4], 'hex'));
    this.oldPrice = rawTopics[5].hexBigNumberToString();
    this.newBid = rawTopics[6].hexBigNumberToString();
    this.paymentToken = BinaryUtils.base64Decode(rawTopics[7]);
    this.paymentTokenNonce = BinaryUtils.hexToBigInt(rawTopics[8])?.toString() ?? '0';
    this.deadline = parseInt(rawTopics[9] ?? '0', 16);
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
