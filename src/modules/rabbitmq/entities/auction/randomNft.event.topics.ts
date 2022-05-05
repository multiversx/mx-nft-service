import '../../../../utils/extentions';

export class RandomNftEventsTopics {
  private campaignId: string;
  private tier: string;
  private boughtNfts: string;

  constructor(rawTopics: string[]) {
    this.campaignId = Buffer.from(rawTopics[1], 'base64').toString();
    this.tier = Buffer.from(rawTopics[2], 'base64').toString('hex');
    this.boughtNfts = Buffer.from(rawTopics[3], 'base64')
      .toString('hex')
      .hexBigNumberToString();
  }

  toPlainObject() {
    return {
      campaignId: this.campaignId,
      tier: this.tier,
      boughtNfts: this.boughtNfts,
    };
  }
}
