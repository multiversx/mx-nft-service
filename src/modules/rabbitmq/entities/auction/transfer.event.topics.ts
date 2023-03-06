import { BinaryUtils } from '@elrondnetwork/erdnest';
import { Address } from '@elrondnetwork/erdjs/out';
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
