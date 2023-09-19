import '../../../../utils/extensions';

export class RandomNftEventsTopics {
  private campaignId: string;
  private tier: string;
  private boughtNfts: string;

  constructor(rawTopics: string[]) {
    this.campaignId = Buffer.from(rawTopics[2], 'base64').toString();
    this.tier = Buffer.from(rawTopics[3], 'base64').toString();
    this.boughtNfts = rawTopics.length >= 5 ? Buffer.from(rawTopics[4], 'base64').toString('hex').hexBigNumberToString() : '1';
  }

  toPlainObject() {
    return {
      campaignId: this.campaignId,
      tier: this.tier,
      boughtNfts: this.boughtNfts,
    };
  }
}
