import '../../../../utils/extentions';

export class IssueCollectionTopics {
  private collection: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[0], 'base64').toString();
  }

  toPlainObject() {
    return {
      collection: this.collection,
    };
  }
}
