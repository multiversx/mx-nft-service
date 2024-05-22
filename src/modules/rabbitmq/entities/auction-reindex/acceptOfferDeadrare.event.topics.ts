import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AcceptOfferDeadrareEventsTopics {
  private offerId: number;
  private auctionId: number;
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

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(rawTopics[1], 16);
    this.auctionId = parseInt(rawTopics[2], 16);
    this.collection = Buffer.from(rawTopics[3], 'hex').toString();
    this.nonce = rawTopics[4];
    this.paymentTokenIdentifier = Buffer.from(rawTopics[5], 'hex').toString();
    this.paymentTokenNonce = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[6])?.toString() ?? '0');
    this.paymentAmount = rawTopics[7].hexBigNumberToString();
    this.nrOfferTokens = parseInt(BinaryUtils.hexToBigInt(rawTopics[9])?.toString() ?? '1');

    this.startdate = parseInt(rawTopics[9], 16).toString();
    this.enddate = parseInt(rawTopics[8], 16).toString();
    this.offerOwner = new Address(Buffer.from(rawTopics[12], 'hex'));
    this.nftOwner = new Address(Buffer.from(rawTopics[13], 'hex'));
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
