export class UpdatePriceEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private newBid: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'hex').toString();
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.newBid = rawTopics[6].hexBigNumberToString();
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
