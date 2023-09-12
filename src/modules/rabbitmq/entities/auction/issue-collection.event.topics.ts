import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import '../../../../utils/extensions';

export class IssueCollectionTopics {
  private collection: string;

  constructor(rawTopics: string[]) {
    this.collection = BinaryUtils.base64Decode(rawTopics[0]);
  }

  toPlainObject() {
    return {
      collection: this.collection,
    };
  }
}
