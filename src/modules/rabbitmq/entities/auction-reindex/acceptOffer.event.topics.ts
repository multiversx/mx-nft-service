import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AcceptOfferEventsTopics {
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
    this.offerId = parseInt(rawTopics[1], 16);
    this.collection = rawTopics[2].toString();
    this.nonce = rawTopics[3];
    this.nrOfferTokens = parseInt(BinaryUtils.hexToBigInt(rawTopics[4])?.toString() ?? '1');
    this.paymentTokenIdentifier = rawTopics[5].toString();
    this.paymentTokenNonce = parseInt(BinaryUtils.hexToBigInt(rawTopics[6])?.toString() ?? '0');
    this.paymentAmount = rawTopics[7].hexBigNumberToString();
    this.offerOwner = new Address(Buffer.from(rawTopics[8], 'hex'));
    this.nftOwner = new Address(Buffer.from(rawTopics[9], 'hex'));
    this.startdate = parseInt(rawTopics[10]).toString();
    this.enddate = parseInt(rawTopics[11]).toString();
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
