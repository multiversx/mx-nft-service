import { BinaryUtils } from '@elrondnetwork/erdnest';
import '../../../../utils/extentions';

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
