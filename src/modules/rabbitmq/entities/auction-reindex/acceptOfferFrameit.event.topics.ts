import { Address } from '@multiversx/sdk-core';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
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
  private auctionId: number;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(rawTopics[1], 16);
    this.collection = Buffer.from(rawTopics[2], 'hex').toString();
    this.nonce = rawTopics[3];
    this.nrOfferTokens = parseInt(BinaryUtils.hexToBigInt(rawTopics[4])?.toString() ?? '1');
    this.offerOwner = new Address(Buffer.from(rawTopics[5], 'hex'));
    this.paymentTokenIdentifier = Buffer.from(rawTopics[6], 'hex').toString();
    this.paymentTokenNonce = parseInt(BinaryUtils.hexToBigInt(rawTopics[7])?.toString() ?? '0');
    this.paymentAmount = rawTopics[8].hexBigNumberToString();
    if (rawTopics.length > 10) {
      this.nftOwner = new Address(Buffer.from(rawTopics[10], 'hex'));
    }
    if (rawTopics.length > 11) {
      this.auctionId = parseInt(BinaryUtils.tryBase64ToBigInt(rawTopics[11])?.toString() ?? '0');
    }
  }

  toPlainObject() {
    return {
      offerOwner: this.offerOwner.bech32(),
      nftOwner: this.nftOwner?.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
      nrOfferTokens: this.nrOfferTokens,
      paymentTokenIdentifier: this.paymentTokenIdentifier,
      paymentTokenNonce: this.paymentTokenNonce,
      paymentAmount: this.paymentAmount,
      auctionId: this.auctionId,
    };
  }
}
