import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs';
export class AcceptOfferFrameitEventsTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;
  private nrOfferTokens: number;
  private offerOwner: Address;
  private paymentTokenIdentifier: string;
  private paymentTokenNonce: number;
  private paymentAmount: string;
  private nftOwner: Address;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(
      Buffer.from(rawTopics[1], 'base64').toString('hex'),
      16,
    );
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.nrOfferTokens = parseInt(
      BinaryUtils.tryBase64ToBigInt(rawTopics[4])?.toString() ?? '1',
    );
    this.offerOwner = new Address(Buffer.from(rawTopics[5], 'base64'));
    this.paymentTokenIdentifier = Buffer.from(
      rawTopics[6],
      'base64',
    ).toString();
    this.paymentTokenNonce = parseInt(
      BinaryUtils.tryBase64ToBigInt(rawTopics[7])?.toString() ?? '0',
    );
    this.paymentAmount = Buffer.from(rawTopics[8], 'base64')
      .toString('hex')
      .hexBigNumberToString();
    this.nftOwner = new Address(Buffer.from(rawTopics[10], 'base64'));
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
    };
  }
}
