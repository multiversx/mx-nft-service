export class WithdrawOfferEventsTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(Buffer.from(rawTopics[1], 'base64').toString('hex'), 16);
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
    };
  }
}
