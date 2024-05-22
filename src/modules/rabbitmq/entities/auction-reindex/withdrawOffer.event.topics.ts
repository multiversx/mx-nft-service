export class WithdrawOfferEventsTopics {
  private offerId: number;
  private collection: string;
  private nonce: string;

  constructor(rawTopics: string[]) {
    this.offerId = parseInt(rawTopics[1], 16);
    this.collection = Buffer.from(rawTopics[2], 'hex').toString();
    this.nonce = rawTopics[3];
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      offerId: this.offerId,
    };
  }
}
