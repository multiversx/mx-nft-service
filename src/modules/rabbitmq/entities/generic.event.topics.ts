import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import '../../../../utils/extensions';

export class GenericEventsTopics {
  private collection: string;
  private nonce: string;

  constructor(rawTopics: string[]) {
    this.collection = BinaryUtils.base64Decode(rawTopics[0]);
    this.nonce = BinaryUtils.base64ToHex(rawTopics[1]);
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
    };
  }
}
