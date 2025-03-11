import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AcceptOfferXoxnoEventsTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;
  private nrOfferTokens: number;
  private offerOwner: Address;
  private nftOwner: Address;
  private paymentTokenIdentifier: string;
  private paymentTokenNonce: number;
  private paymentAmount: string;
  private startdate: string;
  private enddate: string;
  private auctionId: number;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.nrOfferTokens = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[3])?.toString() ?? '1');
    this.paymentTokenIdentifier = Buffer.from(rawTopics[5], 'base64').toString();
    this.paymentTokenNonce = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[6])?.toString() ?? '0');
    this.paymentAmount = Buffer.from(rawTopics[7], 'base64').toString('hex').hexBigNumberToString();
    this.enddate = parseInt(Buffer.from(rawTopics[8], 'base64').toString('hex'), 16).toString();
    this.startdate = parseInt(Buffer.from(rawTopics[9], 'base64').toString('hex'), 16).toString();
    this.offerOwner = new Address(Buffer.from(rawTopics[10], 'base64'));
    this.offerId = parseInt(Buffer.from(rawTopics[12], 'base64').toString('hex'), 16);
    this.nftOwner = new Address(Buffer.from(rawTopics[13], 'base64'));
    this.auctionId = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[14])?.toString() ?? '0');
  }

  toPlainObject() {
    return {
      offerOwner: this.offerOwner.toBech32(),
      nftOwner: this.nftOwner.toBech32(),
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
      nrOfferTokens: this.nrOfferTokens,
      paymentTokenIdentifier: this.paymentTokenIdentifier,
      paymentTokenNonce: this.paymentTokenNonce,
      paymentAmount: this.paymentAmount,
      startdate: this.startdate,
      enddate: this.enddate,
      auctionId: this.auctionId,
    };
  }
}
