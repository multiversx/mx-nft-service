export class UpdatePriceDeadrareEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private minBid: string;
  private maxBid: string;
  private paymentToken: string;
  private itemsCount: number;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.itemsCount = parseInt(Buffer.from(rawTopics[4], 'base64').toString('hex'), 16);
    this.minBid = Buffer.from(rawTopics[6], 'base64').toString('hex').hexBigNumberToString();
    this.maxBid = Buffer.from(rawTopics[7], 'base64').toString('hex').hexBigNumberToString();
    this.paymentToken = Buffer.from(rawTopics[8], 'base64').toString();
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
