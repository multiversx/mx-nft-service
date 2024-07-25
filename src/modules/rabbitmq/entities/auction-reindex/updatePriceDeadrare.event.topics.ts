export class UpdatePriceDeadrareEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private minBid: string;
  private maxBid: string;
  private paymentToken: string;
  private itemsCount: number;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'hex').toString();
    this.nonce = rawTopics[2];
    this.auctionId = rawTopics[3];
    this.itemsCount = parseInt(rawTopics[4], 16);
    this.minBid = rawTopics[6].hexBigNumberToString();
    this.maxBid = rawTopics[7].hexBigNumberToString();
    this.paymentToken = Buffer.from(rawTopics[8], 'hex').toString();
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      itemsCount: this.itemsCount,
      minBid: this.minBid,
      maxBid: this.maxBid,
      paymentToken: this.paymentToken,
    };
  }
}
