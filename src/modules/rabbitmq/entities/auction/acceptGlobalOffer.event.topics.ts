import { BinaryUtils } from '@elrondnetwork/erdnest';

export class AcceptGlobalOfferEventsTopics {
  private auctionId: number;

  constructor(rawTopics: string[]) {
    this.auctionId = parseInt(
      BinaryUtils.tryBase64ToBigInt(rawTopics[5])?.toString() ?? '0',
    );
  }

  toPlainObject() {
    return {
      auctionId: this.auctionId,
    };
  }
}
