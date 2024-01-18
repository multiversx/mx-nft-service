import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { Address } from '@multiversx/sdk-core';
import '../../../../utils/extensions';

export class TransferEventsTopics {
  private collection: string;
  private nonce: string;
  private receiverAddress: Address;

  constructor(rawTopics: string[]) {
    this.collection = BinaryUtils.base64Decode(rawTopics[0]);
    this.nonce = BinaryUtils.base64ToHex(rawTopics[1]);
    this.receiverAddress = new Address(Buffer.from(rawTopics[3], 'base64'));
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
      receiverAddress: this.receiverAddress,
    };
  }
}

export class MultiTransferEventsTopics {
  private receiverAddress: Address;
  private pairs: any[] = [];

  constructor(rawTopics: string[]) {
    for (let index = 0; index < rawTopics.length - 1; index += 3) {
      this.pairs.push({
        collection: BinaryUtils.base64Decode(rawTopics[index]),
        nonce: BinaryUtils.base64ToHex(rawTopics[index + 1]),
        value: Buffer.from(rawTopics[index + 2], 'base64')
          .toString('hex')
          .hexBigNumberToString(),
      });
    }

    this.receiverAddress = new Address(Buffer.from(rawTopics[rawTopics.length - 1], 'base64'));
  }

  toPlainObject() {
    return {
      pairs: this.pairs,
      receiverAddress: this.receiverAddress,
    };
  }
}
