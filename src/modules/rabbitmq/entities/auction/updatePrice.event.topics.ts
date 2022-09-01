import { Address } from '@elrondnetwork/erdjs';

export class UpdatePriceEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private minBid: string;
  private newBid: string;
  private originalOwner: Address;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.originalOwner = new Address(Buffer.from(rawTopics[5], 'base64'));
    this.minBid = Buffer.from(rawTopics[5], 'base64')
      .toString('hex')
      .hexBigNumberToString();
    this.newBid = Buffer.from(rawTopics[6], 'base64')
      .toString('hex')
      .hexBigNumberToString();
  }

  toPlainObject() {
    return {
      originalOwner: this.originalOwner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      minbid: this.minBid,
      newBid: this.newBid,
    };
  }
}
