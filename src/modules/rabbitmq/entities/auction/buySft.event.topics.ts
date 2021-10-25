import { Address } from '@elrondnetwork/erdjs/out';

export class BuySftEventsTopics {
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private currentWinner: Address;
  private bid: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[1], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.auctionId = Buffer.from(rawTopics[3], 'base64').toString('hex');
    this.currentWinner = new Address(Buffer.from(rawTopics[4], 'base64'));
    this.bid = Buffer.from(rawTopics[6], 'base64')
      .toString('hex')
      .hexBigNumberToString();
  }

  toPlainObject() {
    return {
      currentWinner: this.currentWinner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      bid: this.bid,
    };
  }
}
