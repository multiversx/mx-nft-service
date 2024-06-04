export class ElrondSwapWithdrawTopics {
  private auctionId: string;
  private collection: string;
  private nonce: string;

  constructor(rawTopics: string[]) {
    this.auctionId = Buffer.from(rawTopics[1], 'base64').toString('hex');
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
    };
  }
}
