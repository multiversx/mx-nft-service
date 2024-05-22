import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class SendOfferEventsTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;
  private nrOfferTokens: number;
  private offerOwner: Address;
  private paymentTokenIdentifier: string;
  private paymentTokenNonce: number;
  private paymentAmount: string;
  private startdate: string;
  private enddate: string;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(rawTopics[1], 16);
    this.collection = Buffer.from(rawTopics[2], 'hex').toString();
    this.nonce = rawTopics[3];
    this.nrOfferTokens = parseInt(BinaryUtils.hexToBigInt(rawTopics[4])?.toString() ?? '1');
    this.paymentTokenIdentifier = Buffer.from(rawTopics[5], 'hex').toString();
    this.paymentTokenNonce = parseInt(BinaryUtils.hexToBigInt(rawTopics[6])?.toString() ?? '0');
    this.paymentAmount = rawTopics[7].hexBigNumberToString();
    this.offerOwner = new Address(Buffer.from(rawTopics[8], 'hex'));
    this.startdate = parseInt(rawTopics[9], 16).toString();
    this.enddate = parseInt(rawTopics[10], 16).toString();
  }

  toPlainObject() {
    return {
      offerOwner: this.offerOwner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
      nrOfferTokens: this.nrOfferTokens,
      paymentTokenIdentifier: this.paymentTokenIdentifier,
      paymentTokenNonce: this.paymentTokenNonce,
      paymentAmount: this.paymentAmount,
      startdate: this.startdate,
      enddate: this.enddate,
    };
  }
}
