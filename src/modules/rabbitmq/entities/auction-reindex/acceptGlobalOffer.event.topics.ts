import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

export class AcceptGlobalOfferEventsTopics {
  private auctionId: number;

  constructor(rawTopics: string[]) {
    this.auctionId = parseInt(BinaryUtils.hexToBigInt(rawTopics[5])?.toString() ?? '0');
  }

  toPlainObject() {
    return {
      auctionId: this.auctionId,
    };
  }
}
