import '../../../../utils/extensions';

export class BrandCreatedEventTopics {
  private eventIdentifier: string;

  constructor(rawTopics: string[]) {
    this.eventIdentifier = Buffer.from(rawTopics[0], 'base64').toString();
  }

  toPlainObject() {
    return {
      eventIdentifier: this.eventIdentifier,
    };
  }
}
