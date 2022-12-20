import { Address } from '@elrondnetwork/erdjs';

export class ClaimEventsTopics {
  private currentWinner: Address;
  private collection: string;
  private nonce: string;
  private auctionId: string;
  private boughtTokens: string = '1';

  constructor(rawTopics: string[]) {
    this.currentWinner = new Address(Buffer.from(rawTopics[1], 'base64'));
    this.collection = Buffer.from(rawTopics[2], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[3], 'base64').toString('hex');
  }

  toPlainObject() {
    return {
      currentWinner: this.currentWinner.bech32(),
      collection: this.collection,
      nonce: this.nonce,
      auctionId: this.auctionId,
      boughtTokens: this.boughtTokens,
    };
  }
}
