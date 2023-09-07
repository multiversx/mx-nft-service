export class UpdatePriceEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private newBid: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');

    this.newBid = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      newBid: this.newBid,
    };
  }
}
