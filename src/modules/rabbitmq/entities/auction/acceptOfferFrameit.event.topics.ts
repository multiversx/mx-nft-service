export class AcceptOfferFrameitEventsTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;
  private paymentTokenIdentifier: string;
  private paymentAmount: string;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(
      Buffer.from(rawTopics[1], 'base64').toString('hex'),
      16,
    );
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.paymentTokenIdentifier = Buffer.from(
      rawTopics[6],
      'base64',
    ).toString();
    this.paymentAmount = Buffer.from(rawTopics[7], 'base64')
      .toString('hex')
      .hexBigNumberToString();
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
      paymentTokenIdentifier: this.paymentTokenIdentifier,
      paymentTokenNonce: 0,
      paymentAmount: this.paymentAmount,
    };
  }
}
