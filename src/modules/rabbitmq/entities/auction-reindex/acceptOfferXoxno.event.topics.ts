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
    this.nonce = rawTopics[2];
    this.nrOfferTokens = parseInt(BinaryUtils.hexToBigInt(rawTopics[3])?.toString() ?? '1');
    this.paymentTokenIdentifier = Buffer.from(rawTopics[5], 'hex').toString();
    this.paymentTokenNonce = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[6])?.toString() ?? '0');
    this.paymentAmount = rawTopics[7].hexBigNumberToString();
    this.enddate = parseInt(rawTopics[8], 16).toString();
    this.startdate = parseInt(rawTopics[9], 16).toString();
    this.offerOwner = new Address(Buffer.from(rawTopics[10], 'hex'));
    this.offerId = parseInt(rawTopics[12], 16);
    this.nftOwner = new Address(Buffer.from(rawTopics[13], 'hex'));
    this.auctionId = parseInt(BinaryUtils.hexToBigInt(rawTopics[14])?.toString() ?? '0');
  }

  toPlainObject() {
    return {
      offerOwner: this.offerOwner.bech32(),
      nftOwner: this.nftOwner.bech32(),
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
