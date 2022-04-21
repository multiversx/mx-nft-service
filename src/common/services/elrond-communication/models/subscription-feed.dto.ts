import { TopicEnum } from './feed.dto';

export class SubscriptionFeed {
  referenceType: TopicEnum = TopicEnum.nft;
  referenceId: string;

  constructor(init?: Partial<SubscriptionFeed>) {
    Object.assign(this, init);
  }
}
