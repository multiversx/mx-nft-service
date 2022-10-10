import '../../../../utils/extentions';

export class UpdateAttributesEventsTopics {
  private collection: string;
  private nonce: string;

  constructor(rawTopics: string[]) {
    this.collection = Buffer.from(rawTopics[0], 'base64').toString();
    this.nonce = Buffer.from(rawTopics[1], 'base64').toString('hex');
  }

  toPlainObject() {
    return {
      collection: this.collection,
      nonce: this.nonce,
    };
  }
}
